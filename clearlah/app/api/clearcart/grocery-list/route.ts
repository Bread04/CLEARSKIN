import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";
import { analyzeSafeMeals } from "@/lib/safe-meal-analyzer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveApiUserId(searchParams.get("user_id") || undefined);
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("known_allergens, trigger_cache")
      .eq("user_id", userId)
      .maybeSingle();

    const knownTriggers: string[] = [];
    if (profile?.known_allergens?.length) knownTriggers.push(...profile.known_allergens);

    const triggerCache = profile?.trigger_cache as Record<string, unknown> | null;
    if (triggerCache && "top_triggers" in triggerCache) {
      const topTriggers = (triggerCache as { top_triggers?: Array<{ factor: string }> }).top_triggers || [];
      for (const entry of topTriggers) {
        if (entry.factor) knownTriggers.push(entry.factor);
      }
    }

    const { data: entries } = await supabase
      .from("log_entries")
      .select("logged_at, food, symptoms")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(30);

    if (!entries || entries.length < 7) {
      return NextResponse.json({
        items: [],
        total_days: entries?.length ?? 0,
        generated_at: new Date().toISOString(),
        message: "Log 7+ days to unlock your Safe Shop.",
      });
    }

    const analysis = analyzeSafeMeals(entries, knownTriggers);

    const items = analysis.meals.map((m) => ({
      name: m.dish_name,
      category: m.category,
      frequency: m.frequency,
      last_eaten: m.last_eaten,
      avg_symptom_score: m.avg_symptom_score,
      safe_score: m.safe_score,
    }));

    return NextResponse.json({
      items,
      total_days: analysis.total_days,
      generated_at: analysis.generated_at,
      message: items.length > 0 ? undefined : "No safe meals detected yet. Keep logging!",
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Authentication required", items: [] }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message, items: [] }, { status: 500 });
  }
}
