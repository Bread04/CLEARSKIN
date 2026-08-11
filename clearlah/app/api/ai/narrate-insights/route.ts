import { NextResponse } from "next/server";
import type { CorrelationResult } from "@/lib/pattern-engine";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      correlations?: CorrelationResult[];
      userProfile?: { conditions?: string[] };
    };

    if (!body.correlations?.length) {
      return NextResponse.json({ narrations: [] });
    }

    const apiKey = process.env.CODEBUDDY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        narrations: body.correlations.map((c) =>
          `${c.trigger} appeared on ${c.cooccurrence_count} of your flare days (${c.confidence}% confidence).`
        ),
      });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

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
            {
              role: "system",
              content:
                "You are an AI health detective for ClearLah, a Singapore-based app. Write confident, specific 2-3 sentence explanations that sound like a personal health investigator connecting the dots. Include the mechanism (WHY this trigger matters), the evidence (frequency/confidence), and one actionable takeaway. Use Singlish sparingly ('lah') only for the takeaway. Never make medical claims. Never say 'consult your doctor'. Be warm but precise — like a smart friend who figured something out for you.\n\nCRITICAL — TEMPORAL REASONING: When analysing food triggers, always consider delayed reactions. Many food triggers take 6-12 hours to cause flares. If a food shows a pattern, note that the delay is why users never connected the dots themselves. Say things like 'Your flares typically show up 6-8 hours after eating this — that time lag is why food diaries never caught it.' This temporal insight is what separates you from a simple tracker.",

            },
            {
              role: "user",
              content: `Turn these correlations into plain-English explanations:\n${JSON.stringify(body.correlations)}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({
          narrations: content
            .split(/\d+\.\s*/)
            .filter(Boolean)
            .map((s) => s.trim()),
        });
      }
    } catch {
      // AI unavailable — fallback
    }

    return NextResponse.json({
      narrations: body.correlations.map((c) =>
        `${c.trigger} appeared on ${c.cooccurrence_count} of your flare days (${c.confidence}% confidence).`
      ),
    });
  } catch {
    return NextResponse.json(
      { narrations: [] },
      { status: 503 }
    );
  }
}
