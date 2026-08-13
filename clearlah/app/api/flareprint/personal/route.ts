import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";

function fuzzCoordinate(coord: number): number {
  const offset = (Math.random() - 0.5) * 0.0036; // ~200m at equator
  return Math.round((coord + offset) * 100000) / 100000;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveApiUserId(searchParams.get("user_id") || undefined);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const supabase = await createClient();

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const { data: entries } = await supabase
      .from("log_entries")
      .select("logged_at, location, symptoms, food, weather_snapshot")
      .eq("user_id", userId)
      .gte("logged_at", sinceStr)
      .order("logged_at", { ascending: false })
      .limit(200);

    if (!entries) {
      return NextResponse.json({ flares: [] });
    }

    const flares = entries
      .filter((e) => e.location && typeof e.location.lat === "number" && typeof e.location.lng === "number")
      .map((e) => {
        const maxSymptom = Math.max(
          e.symptoms?.skin ?? 0,
          e.symptoms?.gut ?? 0,
          e.symptoms?.respiratory ?? 0,
        );

        const weather = e.weather_snapshot as { humidity?: number; psi?: number } | null;
        const factors: string[] = [];
        if (typeof weather?.humidity === "number" && weather.humidity > 85) {
          factors.push("high humidity");
        }
        if (typeof weather?.psi === "number" && weather.psi > 100) {
          factors.push("high PSI");
        }
        if (e.food && typeof e.food === "object") {
          const food = e.food as { items?: Array<{ name?: string }> };
          const names = (food.items || []).map((i) => i.name).filter(Boolean);
          if (names.length) {
            factors.push(names.join(", "));
          }
        }

        return {
          lat: (e.location as { lat: number }).lat,
          lng: (e.location as { lng: number }).lng,
          severity: maxSymptom,
          date: e.logged_at,
          factors: factors.slice(0, 3),
        };
      });

    return NextResponse.json({ flares });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Authentication required", flares: [] }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message, flares: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const userId = await resolveApiUserId(body.user_id);

    if (!body.flares || !Array.isArray(body.flares)) {
      return NextResponse.json({ error: "flares array required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("community_sharing")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.community_sharing) {
      return NextResponse.json(
        { error: "Community sharing is not enabled for this account." },
        { status: 403 },
      );
    }

    for (const flare of body.flares) {
      if (typeof flare.lat !== "number" || typeof flare.lng !== "number") continue;
      if (!Number.isFinite(flare.lat) || !Number.isFinite(flare.lng)) continue;

      const fuzzedLat = fuzzCoordinate(flare.lat);
      const fuzzedLng = fuzzCoordinate(flare.lng);
      const gridCellId = `${Math.round(fuzzedLat * 200)}_${Math.round(fuzzedLng * 200)}`;

      const { data: existing } = await supabase
        .from("community_flares")
        .select("flare_count, common_triggers, avg_severity")
        .eq("grid_cell_id", gridCellId)
        .maybeSingle();

      if (existing) {
        const newCount = existing.flare_count + 1;
        const newAvg = (existing.avg_severity * existing.flare_count + (flare.severity || 0)) / newCount;

        const mergedTriggers = Array.from(
          new Set([...(existing.common_triggers || []), ...(flare.factors || [])]),
        ).slice(0, 5);

        await supabase
          .from("community_flares")
          .update({
            flare_count: newCount,
            common_triggers: mergedTriggers,
            avg_severity: Math.round(newAvg * 10) / 10,
            last_updated: new Date().toISOString(),
          })
          .eq("grid_cell_id", gridCellId);
      } else {
        await supabase.from("community_flares").insert({
          grid_cell_id: gridCellId,
          flare_count: 1,
          common_triggers: (flare.factors || []).slice(0, 5),
          avg_severity: flare.severity || 0,
        });
      }
    }

    return NextResponse.json({ success: true, contributed: body.flares.length });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
