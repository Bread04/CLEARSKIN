import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";
import { detectCorrelations } from "@/lib/pattern-engine";
import type { CorrelationResult } from "@/lib/pattern-engine";
import type { DbLogEntry } from "@/lib/types/database";

const AI_TIMEOUT_MS = 12000;

interface AskRequest {
  question: string;
}

interface AskResponse {
  answer: string;
  context_used?: {
    logs_analysed: number;
    trigger_count: number;
    weather_snapshot: boolean;
  };
}

function buildAskSystemPrompt(
  conditions: string[],
  allergens: string[],
  logCount: number,
  triggerSummary: string,
  weatherSummary: string,
  recentFoods: string,
  detailedEvidence: string
): string {
  return `You are ClearLah's AI health detective — a warm, knowledgeable assistant for Singaporeans managing chronic health conditions. You have access to the user's actual log data and can cite specific days, scores, and patterns.

USER PROFILE:
- Conditions: ${conditions.length > 0 ? conditions.join(", ") : "not specified"}
- Known allergens: ${allergens.length > 0 ? allergens.join(", ") : "none specified"}
- Days logged: ${logCount}

THEIR TRIGGER PATTERNS (from ${logCount} days of data):
${triggerSummary || "Not enough data yet — encourage the user to keep logging."}

DETAILED LOG EVIDENCE (for answering "why" or "explain" questions):
${detailedEvidence || "No detailed logs available yet."}

TODAY'S WEATHER IN SINGAPORE:
${weatherSummary}

THEIR RECENTLY LOGGED FOODS:
${recentFoods || "No food data available yet."}

RULES:
- Be specific and personal — reference their actual data, not generic advice.
- When answering "why" questions, cite specific dates, severity scores, and the exact mechanism (e.g. "On Aug 7, you ate laksa and your skin score hit 8/10 by evening — that's a 6-8 hour delay, which is why food diaries miss it").
- If they ask about a specific hawker dish, mention relevant allergens and whether it appears in their trigger patterns.
- If they ask "is today a good day for X?", cross-reference weather + their triggers and cite the evidence.
- ALWAYS mention the TIME DELAY when discussing food triggers — help users understand that flares often come hours after eating, not immediately.
- Use gentle Singlish where natural (lah, sia, can, cannot) but keep it professional.
- NEVER make medical claims or diagnoses. Frame everything as patterns and observations.
- If you don't have enough data to answer confidently, say so honestly and encourage more logging.
- Keep answers to 2-4 sentences unless the question demands detail.
- End with a warm, encouraging tone.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AskRequest;
    if (!body.question?.trim()) {
      return NextResponse.json({ answer: "Ask me anything about your health patterns!" });
    }

    const apiKey = process.env.CODEBUDDY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        answer: "I'm taking a short break — try again in a moment?",
      });
    }

    const userId = await resolveApiUserId();
    const supabase = await createClient();

    const [{ data: profile }, { data: entries }] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("log_entries").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(30),
    ]);

    const logEntries = (entries ?? []) as DbLogEntry[];
    const logCount = logEntries.length;

    const conditions = Array.isArray(profile?.conditions) ? profile.conditions : [];
    const allergens = Array.isArray(profile?.known_allergens) ? profile.known_allergens : [];

    let triggerSummary = "";
    if (logCount >= 7) {
      const result = detectCorrelations(logEntries);
      if (!("status" in result)) {
        triggerSummary = (result as CorrelationResult[])
          .map((c) => `- ${c.trigger} (${c.pillar}): ${c.confidence}% confidence, ${c.cooccurrence_count} occurrences`)
          .join("\n");
      }
    }

    let weatherSummary = "Weather data unavailable.";
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const weatherRes = await fetch(`${baseUrl}/api/weather`);
      if (weatherRes.ok) {
        const w = await weatherRes.json();
        weatherSummary = `Temperature: ${w.temp}°C, Humidity: ${w.humidity}%, PSI: ${w.psi}, UV Index: ${w.uv}. `;
        if (w.humidity > 85) weatherSummary += "HIGH HUMIDITY today — a common trigger.";
        if (w.psi > 100) weatherSummary += " PSI is elevated — respiratory caution.";
      }
    } catch { /* use fallback */ }

    const recentFoods = logEntries
      .slice(0, 7)
      .flatMap((e) => e.food.items.map((i) => i.name))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 15)
      .join(", ");

    const detailedEvidence = logEntries
      .slice(0, 14)
      .map((e) => {
        const date = new Date(e.logged_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
        const foods = e.food.items.map((i) => i.name).join(", ") || "nothing logged";
        const skinScore = e.symptoms.skin ? `skin ${e.symptoms.skin}/10` : "";
        const humidity = e.weather_snapshot ? `humidity ${e.weather_snapshot.humidity}%` : "";
        const sleep = e.lifestyle.sleep_hours ? `sleep ${e.lifestyle.sleep_hours}h` : "";
        const stress = e.lifestyle.stress_level ? `stress ${e.lifestyle.stress_level}/5` : "";
        const relevant = [skinScore, humidity, sleep, stress].filter(Boolean).join(", ");
        return `${date}: ate [${foods}]${relevant ? ` | ${relevant}` : ""}`;
      })
      .join("\n");

    const systemPrompt = buildAskSystemPrompt(
      conditions,
      allergens,
      logCount,
      triggerSummary,
      weatherSummary,
      recentFoods,
      detailedEvidence
    );

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
            { role: "user", content: body.question.trim() },
          ],
          temperature: 0.7,
          max_tokens: 400,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const answer = data.choices?.[0]?.message?.content?.trim();
        if (answer) {
          return NextResponse.json({ answer });
        }
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        console.warn("[ai] Ask ClearLah timed out");
      }
    }

    return NextResponse.json({
      answer: "Sorry, I'm having trouble thinking right now. Try again in a bit?",
    });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ answer: "Please complete onboarding first." }, { status: 401 });
    }
    if (e instanceof Error && "digest" in e) throw e;
    console.error("[ai] POST /api/ai/ask error:", e);
    return NextResponse.json({ answer: "Something went wrong. Try again?" }, { status: 500 });
  }
}
