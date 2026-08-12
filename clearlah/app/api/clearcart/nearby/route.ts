import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveApiUserId(searchParams.get("user_id") || undefined);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("known_allergens, trigger_cache")
      .eq("user_id", userId)
      .maybeSingle();

    const triggerAllergens = new Set<string>();
    if (profile?.known_allergens?.length) {
      profile.known_allergens.forEach((a: string) => triggerAllergens.add(a.toLowerCase()));
    }

    const { data: allDishes } = await supabase
      .from("hawker_dishes")
      .select("id, name_en, name_ms, name_zh, allergens, category, food_type")
      .order("popularity_rank", { ascending: false })
      .limit(50);

    if (!allDishes) {
      return NextResponse.json({ dishes: [] });
    }

    const safeDishes = allDishes
      .map((dish) => {
        const dishAllergens = (dish.allergens || []) as string[];
        let overlap = 0;
        for (const a of dishAllergens) {
          if (triggerAllergens.has(a.toLowerCase())) overlap++;
        }

        const total = triggerAllergens.size || 1;
        const safety = Math.round((1 - overlap / total) * 100);

        const foodTypeLabel =
          dish.food_type === "restaurant" ? "Restaurant" : dish.food_type === "international" ? "International" : "Hawker";

        return {
          dish_id: dish.id,
          dish_name: dish.name_en,
          dish_name_ms: dish.name_ms,
          dish_name_zh: dish.name_zh,
          category: dish.category,
          food_type: foodTypeLabel,
          allergens: dishAllergens,
          safety_score: safety,
        };
      })
      .filter((d) => d.safety_score >= 92)
      .sort((a, b) => b.safety_score - a.safety_score)
      .slice(0, 10);

    return NextResponse.json({ dishes: safeDishes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message, dishes: [] }, { status: 500 });
  }
}
