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
                "You are a health insights narrator for ClearLah. Write calm, factual, one-sentence explanations. No medical claims or alarm language. Never say 'consult your doctor' in these narrations.",
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
