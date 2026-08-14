import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";
import type { CorrelationResult } from "@/lib/pattern-engine";
import type { DbLogEntry } from "@/lib/types/database";

const AI_TIMEOUT_MS = 12000;

function fallbackNarrations(correlations: CorrelationResult[]): string[] {
  return correlations.map(
    (c) =>
      `${c.trigger} appeared on ${c.cooccurrence_count} of your flare days (${c.confidence}% confidence).`
  );
}

function buildEvidenceLines(entries: DbLogEntry[]): string {
  return entries
    .map((e) => {
      const date = new Date(e.logged_at).toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
      });
      const foods = e.food.items.map((i) => i.name).join(", ") || "nothing logged";
      const skin = e.symptoms.skin ? `skin ${e.symptoms.skin}/10` : "";
      const gut = e.symptoms.gut ? `gut ${e.symptoms.gut}/10` : "";
      const resp = e.symptoms.respiratory ? `respiratory ${e.symptoms.respiratory}/10` : "";
      const humidity = e.weather_snapshot ? `humidity ${e.weather_snapshot.humidity}%` : "";
      const sleep = e.lifestyle.sleep_hours ? `sleep ${e.lifestyle.sleep_hours}h` : "";
      const stress = e.lifestyle.stress_level ? `stress ${e.lifestyle.stress_level}/5` : "";
      const skincare = e.skincare ? `skincare "${e.skincare}"` : "";
      const relevant = [skin, gut, resp, humidity, sleep, stress, skincare]
        .filter(Boolean)
        .join(", ");
      return `${date}: ate [${foods}]${relevant ? ` | ${relevant}` : ""}`;
    })
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      correlations?: CorrelationResult[];
      userProfile?: { conditions?: string[] };
    };

    const correlations = body.correlations ?? [];
    if (!correlations.length) {
      return NextResponse.json({ narrations: [] });
    }

    const apiKey = process.env.CODEBUDDY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ narrations: fallbackNarrations(correlations) });
    }

    // The deterministic engine provides the ranked baseline. To let the agent
    // do genuine multi-variable + temporal reasoning, load the raw day-by-day
    // evidence and hand it to the model alongside that baseline.
    let evidence = "";
    try {
      const userId = await resolveApiUserId();
      const supabase = await createClient();
      const { data: entries } = await supabase
        .from("log_entries")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: true })
        .limit(14);

      evidence = buildEvidenceLines((entries ?? []) as DbLogEntry[]);
    } catch {
      evidence = "";
    }

    const conditions = Array.isArray(body.userProfile?.conditions)
      ? body.userProfile?.conditions
      : [];

    const systemPrompt = `You are ClearLah's AI health detective — a warm, precise Singapore-based investigator who connects the dots across food, lifestyle, skincare, symptoms, and weather. You reason across variables TOGETHER, not one at a time, and you always explain the mechanism, not just the correlation.

USER CONDITIONS: ${conditions.length ? conditions.join(", ") : "not specified"}

TASK: You are given (1) a list of baseline triggers ranked by a deterministic correlation engine, and (2) the user's raw day-by-day log evidence. For EACH baseline trigger, produce one narration that:
- Explains WHY that trigger matters for THIS user, citing specific dates and the actual values from the evidence (e.g. "On Aug 5 and Aug 11 you ate shellfish and your skin hit 8/10 by evening").
- Looks for CO-FACTORS: find the combinations that make the trigger worse (e.g. "shellfish only flares when humidity is above 85% AND sleep is under 6 hours — those two days had all three").
- Applies TEMPORAL REASONING for food triggers: flares often arrive 6-12 hours after eating, so a same-day match may hide a delayed reaction. Call this out explicitly when it fits the data.
- Never fabricates a date, number, or co-factor that is not in the evidence. If the evidence does not support a combination, do not invent one — keep it to what the data shows.

RULES:
- Output EXACTLY one numbered item per baseline trigger, in the same order, formatted as "1. ..." then "2. ..." and so on. Do not add headings or extra items.
- 2-4 sentences each.
- Frame everything as patterns and observations. NEVER make medical claims or diagnoses. Do not say "consult your doctor".
- Use gentle Singlish sparingly ("lah") only for a takeaway. Be warm but precise — like a smart friend who figured something out for you.`;

    const userContent = `BASELINE TRIGGERS (explain each, in this exact order):\n${JSON.stringify(
      correlations
    )}\n\nRAW DAY-BY-DAY LOG EVIDENCE (chronological order):\n${
      evidence || "(no raw evidence available — explain from the baseline summaries only)"
    }`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "ClearLah",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        const narrations = content
          .split(/\d+\.\s*/)
          .filter(Boolean)
          .map((s) => s.trim());

        if (narrations.length === correlations.length) {
          return NextResponse.json({ narrations });
        }

        // If the model drifted off the expected count, fall back rather than
        // misalign narrations with cards.
        return NextResponse.json({ narrations: fallbackNarrations(correlations) });
      }
    } catch {
      clearTimeout(timeout);
    }

    return NextResponse.json({ narrations: fallbackNarrations(correlations) });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ narrations: [] }, { status: 401 });
    }
    if (e instanceof Error && "digest" in e) throw e;
    return NextResponse.json({ narrations: [] }, { status: 503 });
  }
}
