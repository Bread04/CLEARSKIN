import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const supabase = await createClient();

    if (!q) {
      const { data } = await supabase
        .from("hawker_dishes")
        .select("id, name_en, name_ms, name_zh, allergens, category")
        .order("popularity_rank", { ascending: true })
        .limit(10);

      return NextResponse.json({ results: data ?? [] });
    }

    const { data } = await supabase
      .from("hawker_dishes")
      .select("id, name_en, name_ms, name_zh, allergens, category")
      .or(`name_en.ilike.%${q}%,name_ms.ilike.%${q}%,name_zh.ilike.%${q}%`)
      .order("popularity_rank", { ascending: true })
      .limit(10);

    return NextResponse.json({ results: data ?? [] });
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("[ClearLah] GET /api/hawker error:", e);
    return NextResponse.json({ results: [] });
  }
}
