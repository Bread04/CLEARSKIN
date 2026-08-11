import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthenticatedError, isDemoMode } from "@/lib/utils/demo";
import { resolveApiUserId } from "@/lib/utils/user-server";
import type {
  ParsedLog,
  WeatherSnapshot,
  DbLogEntry,
} from "@/lib/types/database";

interface SaveLogRequest {
  log: ParsedLog;
  weather_snapshot: WeatherSnapshot;
  user_id?: string;
  demo_date?: string;
}

export async function POST(request: Request) {
  try {
    let body: SaveLogRequest;
    try {
      body = (await request.json()) as SaveLogRequest;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body — expected valid JSON" },
        { status: 400 }
      );
    }

    const userId = await resolveApiUserId(
      typeof body.user_id === "string" ? body.user_id : undefined
    );

    if (!body.log || !body.weather_snapshot) {
      return NextResponse.json(
        { success: false, error: "log and weather_snapshot are required" },
        { status: 400 }
      );
    }

    const { log, weather_snapshot } = body;
    const demoDate = typeof body.demo_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.demo_date)
      ? body.demo_date
      : null;
    const today = demoDate ?? new Date().toISOString().split("T")[0];

    const entry = {
      user_id: userId,
      logged_at: today,
      food: { items: log.food.items.map((name) => ({ name })) },
      lifestyle: {
        sleep_hours: log.lifestyle.sleep_hours,
        stress_level: log.lifestyle.stress_level,
        stress_type: log.lifestyle.stress_type,
      },
      skincare: log.skincare,
      symptoms: {
        skin: log.symptoms.skin,
        gut: log.symptoms.gut,
        respiratory: log.symptoms.respiratory,
      },
      weather_snapshot,
      created_at: new Date().toISOString(),
    };

    const supabase = await createClient();

    const { error: upsertError } = await supabase
      .from("log_entries")
      .upsert(entry, { onConflict: "user_id, logged_at" });

    if (upsertError) {
      console.error("[ClearLah] Log entry upsert failed:", upsertError.message);
      return NextResponse.json(
        { success: false, error: "Could not save your log. Please try again." },
        { status: 500 }
      );
    }

    const yesterdayDate = new Date(today + "T00:00:00");
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("streak, streak_last_date")
      .eq("user_id", userId)
      .maybeSingle();

    let newStreak = 1;
    const currentStreak = profile?.streak ?? 0;
    const lastDate = profile?.streak_last_date;

    if (lastDate === yesterdayStr) {
      newStreak = currentStreak + 1;
    } else if (lastDate === today) {
      newStreak = currentStreak;
    }

    await supabase
      .from("user_profiles")
      .upsert(
        { user_id: userId, streak: newStreak, streak_last_date: today, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    return NextResponse.json({
      success: true,
      entry,
      streak: newStreak,
      streak_last_date: today,
    });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (e instanceof Error && "digest" in e) throw e;
    console.error("[ClearLah] POST /api/logs unexpected error:", e);
    return NextResponse.json(
      { success: false, error: "Something went wrong on our end — try again in a sec?" },
      { status: 500 }
    );
  }
}
