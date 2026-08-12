import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get("dish_id");
    const stallName = searchParams.get("stall_name");

    if (!dishId && !stallName) {
      return NextResponse.json({ error: "dish_id or stall_name is required" }, { status: 400 });
    }

    const supabase = await createClient();

    let query = supabase.from("stall_reports").select("*");

    if (dishId) {
      query = query.eq("dish_id", dishId);
    }
    if (stallName) {
      query = query.ilike("stall_name", `%${stallName}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("stall_reports fetch error:", error.message);
      return NextResponse.json({ reports: [] });
    }

    const reports = (data || [])
      .filter((r) => r.reporter_count >= 3)
      .map((r) => ({
        stall_name: r.stall_name,
        dish_id: r.dish_id,
        reporter_count: r.reporter_count,
        report_date: r.report_date,
      }));

    return NextResponse.json({ reports });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message, reports: [] }, { status: 500 });
  }
}
