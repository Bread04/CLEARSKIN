import { NextResponse } from "next/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";
import {
  classifySeverity,
  buildTriage,
  clampScore,
  SKIN_DISCLAIMER,
  type SkinAssessment,
} from "@/lib/skin-check";

const AI_TIMEOUT_MS = 12000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.image !== "string") {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(body.image)) {
      return NextResponse.json(
        { error: "Image must be a base64 data URL (PNG, JPEG, or WebP)." },
        { status: 400 }
      );
    }

    if (body.image.length > 3_200_000) {
      return NextResponse.json(
        { error: "Image is too large. Please use a smaller photo." },
        { status: 400 }
      );
    }

    // Identity is resolved for consistency with the rest of the API surface.
    await resolveApiUserId(typeof body.user_id === "string" ? body.user_id : undefined);

    const apiKey = process.env.CODEBUDDY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let raw: { score: number | null; indicators: string[]; summary: string } | null = null;
    let aiError = false;

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
            {
              role: "system",
              content: `You are a wellness-grade skin tracking assistant for ClearLah, focused on eczema (atopic dermatitis). Given a photo of skin, estimate a flare tracking score from 0 (clear) to 10 (severe flare) to help the user monitor changes over time.

You must NOT provide a medical diagnosis and must NOT recommend treatments or medications.

Respond ONLY with valid JSON: {"score": <0-10 number>, "indicators": ["redness","dryness","scaling","weeping","crusting","oozing"], "summary": "one sentence describing what you observe"}.

Use only these indicator terms: redness, dryness, scaling, itching, weeping, oozing, crusting, open wound, blistering, swelling, widespread, localized.

If the image is not a clear, well-lit view of skin (for example a face, a room, or a document), return {"score": null, "indicators": [], "summary": "unable to assess"}.`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Assess the eczema flare shown in this image on a 0-10 scale." },
                { type: "image_url", image_url: { url: body.image, detail: "low" } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 300,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        aiError = true;
      } else {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        try {
          const parsed = JSON.parse(content.trim());
          raw = {
            score: typeof parsed.score === "number" ? parsed.score : null,
            indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
            summary: typeof parsed.summary === "string" ? parsed.summary : "",
          };
        } catch {
          raw = null;
        }
      }
    } catch {
      aiError = true;
    } finally {
      clearTimeout(timeout);
    }

    if (aiError) {
      return NextResponse.json(
        { error: "Skin analysis service is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    if (!raw || raw.score === null) {
      return NextResponse.json({
        assessment: null,
        message: "I couldn't get a clear read from that photo. Try a close-up in good light.",
      });
    }

    const score = clampScore(raw.score);
    const severity = classifySeverity(score);
    const triage = buildTriage(score, raw.indicators);

    const assessment: SkinAssessment = {
      score,
      severity,
      indicators: raw.indicators,
      summary: raw.summary || "Skin assessment complete.",
      selfCare: triage.selfCare,
      escalate: triage.escalate,
      escalationReason: triage.escalationReason,
    };

    return NextResponse.json({
      assessment,
      disclaimer: SKIN_DISCLAIMER,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
