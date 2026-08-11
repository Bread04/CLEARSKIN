import { NextResponse } from "next/server";
import type { ParseLogRequest, ParsedLog, ParseLogResponse } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";

const AI_TIMEOUT_MS = 8000;

function buildSystemPrompt(conditions: string[], knownAllergens: string[]): string {
  const conditionLine =
    conditions.length > 0
      ? `User has ${conditions.join(", ")}. Prioritise tracking of relevant symptoms.`
      : "";

  const allergenLine =
    knownAllergens.length > 0
      ? `User has known allergies to: ${knownAllergens.join(", ")}. Flag these if detected.`
      : "";

  return `You are a health log parser for ClearLah, an app that helps users track food, lifestyle, skincare, and symptom triggers for chronic conditions.

${conditionLine}
${allergenLine}

Given a user's free-text description of their day, extract structured data:
- food.items: list of food/drink items mentioned
- food.hawker_dishes: any Singapore hawker dishes identified
- lifestyle.sleep_hours: number of hours slept (null if not mentioned)
- lifestyle.stress_level: 1-5 scale (null if not mentioned)
- lifestyle.stress_type: "work" | "relationship" | "physical" | "financial" | "other" (null if not mentioned)
- lifestyle.exercise_minutes: minutes of exercise (null if not mentioned; infer from mentions like "ran 30min", "gym", "10k steps")
- lifestyle.water_ml: ml of water drunk (null if not mentioned; estimate from "8 glasses" ≈ 2000ml, "2 bottles" ≈ 1000ml)
- lifestyle.caffeine_cups: cups of coffee/tea/energy drinks (null if not mentioned)
- lifestyle.alcohol_drinks: number of alcoholic drinks (null if not mentioned)
- skincare: skincare products used today (null if not mentioned)
- symptoms.skin: 1-10 severity (null if not mentioned or not applicable)
- symptoms.gut: 1-10 severity
- symptoms.respiratory: 1-10 severity
- summary: one-sentence plain-English summary of the day

Respond ONLY with valid JSON. No markdown, no explanation. Example:
{"food":{"items":["laksa","teh tarik"],"hawker_dishes":["Laksa"]},"lifestyle":{"sleep_hours":6.5,"stress_level":4,"stress_type":"work","exercise_minutes":30,"water_ml":1500,"caffeine_cups":2,"alcohol_drinks":null},"skincare":"Cetaphil moisturiser","symptoms":{"skin":7,"gut":null,"respiratory":null},"summary":"Laksa for lunch, stressed from work, skin flaring tonight."}`;
}

function basicFallbackParse(message: string): Partial<ParsedLog> {
  const lower = message.toLowerCase();
  const items: string[] = [];
  const hawkerDishes: string[] = [];

  const knownDishes = [
    "laksa", "chicken rice", "nasi lemak", "hokkien mee", "char kway teow",
    "satay", "roti prata", "bak chor mee", "wonton mee", "prawn mee",
    "fishball noodles", "ban mian", "duck rice", "biryani", "nasi goreng",
    "curry rice", "mee goreng", "mee rebus", "mee siam", "lor mee",
    "yong tau foo", "claypot rice", "nasi padang", "economic rice",
    "oyster omelette", "carrot cake", "teh tarik", "kopi", "milo dinosaur",
    "bandung", "barley", "sugarcane", "soy bean", "ice kachang", "chendol",
    "goreng pisang", "curry puff", "spring roll", "rojak", "kaya toast",
    "roti john", "thosai", "popiah", "murtabak", "kueh pie tee",
    "bak kut teh", "fish soup", "tom yum", "soup kambing",
    "chee cheong fun", "chwee kueh", "putu piring", "ondeh ondeh",
    "bbq stingray", "otak otak", "satay", "grilled chicken wings",
    "sambal kangkong", "fried tofu", "ngoh hiang", "tahu goreng",
  ];

  for (const dish of knownDishes) {
    if (lower.includes(dish)) {
      hawkerDishes.push(dish.charAt(0).toUpperCase() + dish.slice(1));
    }
  }

  const foodKeywords = lower.match(
    /(?:had|ate|ordered|bought|tried|cooked|drank)\s+([^.,!?]+)/gi
  );
  if (foodKeywords) {
    for (const match of foodKeywords) {
      const food = match.replace(/^(had|ate|ordered|bought|tried|cooked|drank)\s+/i, "").trim();
      if (food && !items.includes(food)) items.push(food);
    }
  }

  if (hawkerDishes.length > 0 && items.length === 0) {
    items.push(...hawkerDishes);
  }
  if (items.length === 0 && lower.length >= 2) {
    items.push(message.trim().split(/[.,!?]/)[0] || message.trim());
  }

  const sleepMatch = lower.match(/(?:slept|sleep)\s*(?:for\s*)?(\d+\.?\d*)\s*(?:h|hours?|hrs?)/i);
  const sleepHours = sleepMatch ? parseFloat(sleepMatch[1]) : null;

  let stressLevel: number | null = null;
  let stressType: string | null = null;
  const stressMatch = lower.match(/stress(?:ed)?\s*(?:level\s*)?(\d)/i);
  if (stressMatch) stressLevel = parseInt(stressMatch[1], 10);
  if (lower.includes("work")) stressType = "work";
  else if (lower.includes("relationship")) stressType = "relationship";
  else if (lower.includes("physical")) stressType = "physical";
  else if (lower.includes("financial") || lower.includes("money")) stressType = "financial";

  const skinMatch = lower.match(/(?:skin|itch|rash|flare|eczema|severity)[\s\S]*?(\d+)/i);
  const skin = skinMatch ? parseInt(skinMatch[1], 10) : (lower.includes("itch") ? 6 : null);

  const skincareMatch = lower.match(
    /(?:cetaphil|cerave|la roche-posay|aveeno|eucerin|qv|sebamed|innisfree\s+aloe|moisturiser|moisturizer|cream|lotion|sunblock|sunscreen)/gi
  );
  const skincare = skincareMatch ? skincareMatch.join(", ") : null;

  const exerciseMatch = lower.match(/(?:ran|run|jog|gym|workout|exercise|walked)\s*(?:for\s*)?(\d+)/i);
  const exerciseMinutes = exerciseMatch ? parseInt(exerciseMatch[1], 10) : null;

  const waterMatch = lower.match(/(?:water|drank)\s*(?:about\s*)?(\d+)\s*(?:glass(?:es)?|cups?|bottles?|ml)/i);
  let waterMl: number | null = null;
  if (waterMatch) {
    const amt = parseInt(waterMatch[1], 10);
    if (lower.includes("glass")) waterMl = amt * 250;
    else if (lower.includes("bottle")) waterMl = amt * 500;
    else waterMl = amt;
  }

  const caffeineMatch = lower.match(/(?:coffee|tea|kopi|teh|caffeine|espresso|latte)\b/i);
  const caffeineCups = caffeineMatch ? (lower.match(/(\d+)\s*(?:cups?|shots?)\s*(?:of\s*)?(?:coffee|tea|kopi|teh)/i)?.[1] ? parseInt(lower.match(/(\d+)\s*(?:cups?|shots?)\s*(?:of\s*)?(?:coffee|tea|kopi|teh)/i)![1], 10) : 1) : null;

  const alcoholMatch = lower.match(/(?:beer|wine|cocktail|alcohol|whiskey|soju|sake|pint|drink)\b/i);
  const alcoholDrinks = alcoholMatch ? (lower.match(/(\d+)\s*(?:drinks?|pints?|glasses?|shots?|bottles?)/i)?.[1] ? parseInt(lower.match(/(\d+)\s*(?:drinks?|pints?|glasses?|shots?|bottles?)/i)![1], 10) : 1) : null;

  return {
    food: { items, hawker_dishes: hawkerDishes },
    lifestyle: {
      sleep_hours: sleepHours,
      stress_level: stressLevel,
      stress_type: stressType,
      exercise_minutes: exerciseMinutes,
      water_ml: waterMl,
      caffeine_cups: caffeineCups,
      alcohol_drinks: alcoholDrinks,
    },
    skincare,
    symptoms: { skin, gut: null, respiratory: null },
    summary: message.trim().slice(0, 120),
  };
}

async function callCodeBuddyAI(
  systemPrompt: string,
  userMessage: string
): Promise<ParsedLog | null> {
  const apiKey = process.env.CODEBUDDY_API_KEY;
  if (!apiKey) return null;

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
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[ai] CodeBuddy API returned ${res.status} ${res.statusText}`);
      return null;
    }

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as ParsedLog;
    return parsed;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("[ai] CodeBuddy API timed out");
      return null;
    }
    if (err instanceof Error && "digest" in err) throw err;
    console.warn(`[ai] CodeBuddy API call failed: ${String(err)}`);
    return null;
  }
}

export async function POST(request: Request): Promise<NextResponse<ParseLogResponse>> {
  try {
    let body: ParseLogRequest & { user_id?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { success: false, error: "ai_unavailable", partial: {} },
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: "ai_unavailable", partial: {} },
        { status: 400 }
      );
    }

    const message = body.message.trim();
    const conditions = Array.isArray(body.userProfile?.conditions)
      ? body.userProfile.conditions
      : [];
    const knownAllergens = Array.isArray(body.userProfile?.known_allergens)
      ? body.userProfile.known_allergens
      : [];

    const systemPrompt = buildSystemPrompt(conditions, knownAllergens);

    let fewShotExamples = "";
    try {
      const supabase = await createClient();
      const uid = await resolveApiUserId();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("ai_feedback_log")
        .eq("user_id", uid)
        .maybeSingle();

      const feedbackLog = (profile?.ai_feedback_log as Array<{
        message: string;
        parsed: Record<string, unknown>;
        rating: string;
        corrections: Record<string, unknown> | null;
      }> | null) ?? [];

      const corrections = feedbackLog
        .filter((f) => f.rating === "inaccurate" && f.corrections)
        .slice(0, 3);

      if (corrections.length > 0) {
        fewShotExamples = "\n\nRECENT CORRECTIONS (learn from these):\n" +
          corrections.map((c) =>
            `User said: "${c.message}"\nI parsed: ${JSON.stringify(c.parsed)}\nCorrected to: ${JSON.stringify(c.corrections)}`
          ).join("\n\n");
      }
    } catch {
      // not blocking — AI works fine without feedback history
    }

    const finalSystemPrompt = systemPrompt + fewShotExamples;

    const startTime = Date.now();
    const aiResult = await callCodeBuddyAI(finalSystemPrompt, message);
    const duration = Date.now() - startTime;

    if (aiResult) {
      return NextResponse.json({ success: true, parsed: aiResult });
    }

    console.warn(`[ai] AI unavailable — using basic fallback (${duration}ms)`);

    const fallback = basicFallbackParse(message);

    return NextResponse.json(
      { success: false, error: "ai_unavailable", partial: fallback },
      { status: 503 }
    );
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json(
        { success: false, error: "ai_unavailable", partial: {} },
        { status: 401 }
      );
    }
    if (e instanceof Error && "digest" in e) throw e;
    console.error("[ai] POST /api/ai/parse-log unexpected error:", e);
    return NextResponse.json(
      { success: false, error: "ai_unavailable", partial: {} },
      { status: 503 }
    );
  }
}
