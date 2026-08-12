import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("community_flares")
      .select("*")
      .gte("flare_count", 3)
      .order("flare_count", { ascending: false })
      .limit(100);

    const cells = (data || []).map((c) => {
      const parts = c.grid_cell_id.split("_");
      return {
        grid_cell_id: c.grid_cell_id,
        lat: parseInt(parts[0], 10) / 200,
        lng: parseInt(parts[1], 10) / 200,
        flare_count: c.flare_count,
        common_triggers: c.common_triggers || [],
        avg_severity: c.avg_severity,
        last_updated: c.last_updated,
      };
    });

    return NextResponse.json({ cells });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message, cells: [] }, { status: 500 });
  }
}
