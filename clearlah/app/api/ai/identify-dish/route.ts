import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";

const AI_TIMEOUT_MS = 12000;

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, (m) => `\\${m}`);
}

async function matchDishToDb(supabase: Awaited<ReturnType<typeof createClient>>, dishName: string) {
  const safeName = escapeIlike(dishName);
  const { data: dishes } = await supabase
    .from("hawker_dishes")
    .select("id, name_en, name_ms, name_zh, allergens, category")
    .or(`name_en.ilike.%${safeName}%,name_ms.ilike.%${safeName}%,name_zh.ilike.%${safeName}%`)
    .limit(5);

  if (!dishes || dishes.length === 0) return null;

  const best = dishes[0];
  const exact = dishes.find(
    (d) =>
      d.name_en.toLowerCase() === dishName.toLowerCase() ||
      d.name_ms?.toLowerCase() === dishName.toLowerCase() ||
      d.name_zh === dishName,
  );

  const match = exact || best;
  return {
    dish_id: match.id,
    dish_name: match.name_en,
    dish_name_ms: match.name_ms,
    dish_name_zh: match.name_zh,
    allergens: match.allergens || [],
  };
}

async function computeRisk(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  allergens: string[],
  dishName: string,
) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("known_allergens, trigger_cache")
    .eq("user_id", userId)
    .maybeSingle();

  const knownAllergens = new Set((profile?.known_allergens || []).map((a: string) => a.toLowerCase()));
  const triggerCache = profile?.trigger_cache || {};

  const matchedTriggers: string[] = [];
  for (const allergen of allergens) {
    if (knownAllergens.has(allergen.toLowerCase())) {
      matchedTriggers.push(allergen);
    }
  }

  if (typeof triggerCache === "object" && triggerCache !== null && "top_triggers" in triggerCache) {
    const topTriggers = (triggerCache as { top_triggers?: Array<{ factor?: string; trigger?: string }> }).top_triggers || [];
    for (const entry of topTriggers) {
      const factor = entry.factor ?? entry.trigger;
      if (!factor) continue;
      const triggerLower = factor.toLowerCase();
      for (const allergen of allergens) {
        if (triggerLower.includes(allergen.toLowerCase()) || allergen.toLowerCase().includes(triggerLower)) {
          if (!matchedTriggers.includes(allergen)) matchedTriggers.push(allergen);
        }
      }
    }
  }

  if (matchedTriggers.length >= 2) {
    return {
      risk_score: 85,
      risk_label: "high" as const,
      risk_reason: `${dishName} contains ${matchedTriggers.join(", ")} — both are confirmed triggers for you.`,
    };
  }
  if (matchedTriggers.length === 1) {
    return {
      risk_score: 65,
      risk_label: "moderate" as const,
      risk_reason: `${dishName} contains ${matchedTriggers[0]} — a known trigger for you.`,
    };
  }
  return {
    risk_score: 15,
    risk_label: "safe" as const,
    risk_reason: `${dishName} doesn't contain any of your known trigger foods.`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.image !== "string") {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    if (!body.image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Image must be a data URL (data:image/...)" }, { status: 400 });
    }

    // Cap payload at ~3MB to avoid forwarding oversized images to the model
    if (body.image.length > 3_200_000) {
      return NextResponse.json({ error: "Image is too large. Please use a smaller photo." }, { status: 400 });
    }

    const userId = await resolveApiUserId(body.user_id);

    const apiKey = process.env.CODEBUDDY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    const supabase = await createClient();

    let dishName: string | null = null;
    let confidence = 0;
    let source: "vision" | "ocr" | "fallback" = "fallback";

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
            {
              role: "system",
              content: `You are a food identification system for Singapore hawker food. Given an image, identify the dish shown. 

Respond ONLY with valid JSON: {"dish_name": "exact dish name in English", "source": "vision", "confidence": 0-100}
If you see a stall signboard instead of food, extract the stall name and list likely dishes from that stall. Set source to "ocr" and confidence based on how clear the text is.
If you cannot identify the dish, return {"dish_name": null, "source": "unknown", "confidence": 0}
Be specific: prefer "Char Kway Teow" over "fried noodles", "Hainanese Chicken Rice" over "chicken and rice".`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What Singapore hawker dish is shown in this image?",
                },
                {
                  type: "image_url",
                  image_url: { url: body.image, detail: "low" },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 200,
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        try {
          const parsed = JSON.parse(content.trim());
          dishName = parsed.dish_name || null;
          confidence = parsed.confidence || 0;
          source = parsed.source || "fallback";
        } catch {
          dishName = null;
        }
      }
    } catch {
      // AI call failed or timed out — fall through to not-found
    } finally {
      clearTimeout(timeout);
    }

    if (!dishName) {
      return NextResponse.json({
        dish: null,
        message: "Could not identify the dish. Try searching by name instead.",
      });
    }

    const dbDish = await matchDishToDb(supabase, dishName);

    if (!dbDish) {
      return NextResponse.json({
        dish: {
          dish_id: "",
          dish_name: dishName,
          confidence,
          allergens: [],
          risk_score: 0,
          risk_label: "safe" as const,
          risk_reason: "Dish not found in our database yet. Log it to help us build coverage.",
          source,
        },
      });
    }

    const risk = await computeRisk(supabase, userId, dbDish.allergens, dbDish.dish_name);

    return NextResponse.json({
      dish: {
        dish_id: dbDish.dish_id,
        dish_name: dbDish.dish_name,
        dish_name_ms: dbDish.dish_name_ms,
        dish_name_zh: dbDish.dish_name_zh,
        confidence,
        allergens: dbDish.allergens,
        risk_score: risk.risk_score,
        risk_label: risk.risk_label,
        risk_reason: risk.risk_reason,
        source,
      },
      stall_warnings: [],
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
