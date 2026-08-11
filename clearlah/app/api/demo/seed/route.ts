export const runtime = "nodejs";

/**
 * POST /api/demo/seed
 *
 * Idempotent demo data seed pipeline. Reads demo-data.json from the filesystem
 * and upserts all rows into Supabase. Safe to call repeatedly — every operation
 * uses `onConflict` to produce the same result regardless of call count.
 *
 * Security: only responds when NEXT_PUBLIC_DEMO_MODE is true. Without it the
 * endpoint is a no-op gate — demo data must never enter a production database.
 *
 * Errors are logged and returned in a JSON `error` field with appropriate HTTP
 * status codes. 400 for client errors, 500 for server/internal errors.
 */

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/utils/demo";
import type { SeedApiResponse } from "@/lib/types/database";

interface DemoFixture {
  user: {
    id: string;
    email: string | null;
    created_at: string;
    onboarding_complete: boolean;
  };
  profile: Record<string, unknown>;
  logs: Array<Record<string, unknown>>;
}

function validateFixture(parsed: unknown): parsed is DemoFixture {
  if (!parsed || typeof parsed !== "object") return false;
  const obj = parsed as Record<string, unknown>;
  if (!obj.user || typeof obj.user !== "object") return false;
  if (!obj.profile || typeof obj.profile !== "object") return false;
  if (!Array.isArray(obj.logs)) return false;
  return true;
}

async function loadFixture(): Promise<DemoFixture> {
  const fixturePath = resolve(process.cwd(), "data", "demo-data.json");
  const raw = await readFile(fixturePath, "utf-8");
  const parsed = JSON.parse(raw);
  if (!validateFixture(parsed)) {
    throw new Error("demo-data.json has invalid shape — expected { user, profile, logs }");
  }
  return parsed;
}

function errorResponse(
  message: string,
  status: number
): NextResponse<SeedApiResponse & { error: string }> {
  console.error(`[demo/seed] ${message}`);
  return NextResponse.json(
    { seeded: false, entries: 0, error: message },
    { status }
  );
}

export async function POST(): Promise<
  NextResponse<SeedApiResponse | (SeedApiResponse & { error: string })>
> {
  if (!isDemoMode()) {
    return errorResponse(
      "Seed endpoint is only available when NEXT_PUBLIC_DEMO_MODE=true",
      400
    );
  }

  let fixture: DemoFixture;
  try {
    fixture = await loadFixture();
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return errorResponse("demo-data.json not found — ensure data/demo-data.json exists", 500);
    }
    console.error("[demo/seed] Failed to load fixture:", err);
    const message = err instanceof Error ? err.message : "Failed to read demo data fixture";
    return errorResponse(message, 500);
  }

  // Shift all dates so the most recent log entry is 1 day before today.
  // This keeps the demo data perpetually current regardless of when it's seeded.
  const latestLogDate = fixture.logs
    .map((l) => typeof l.logged_at === "string" ? new Date(l.logged_at) : new Date(0))
    .reduce((max, d) => (d > max ? d : max), new Date(0));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayShift = Math.round(
    (yesterday.getTime() - latestLogDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  function shiftDate(dateStr: string | null | undefined): string | null {
    if (!dateStr || typeof dateStr !== "string") return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + dayShift);
    return d.toISOString().split("T")[0];
  }

  function shiftTimestamp(tsStr: string | null | undefined): string | null {
    if (!tsStr || typeof tsStr !== "string") return null;
    const d = new Date(tsStr);
    if (isNaN(d.getTime())) return tsStr;
    d.setDate(d.getDate() + dayShift);
    return d.toISOString();
  }

  if (dayShift !== 0) {
    for (const log of fixture.logs) {
      if (typeof log.logged_at === "string") {
        log.logged_at = shiftDate(log.logged_at)!;
      }
      if (typeof log.created_at === "string") {
        log.created_at = shiftTimestamp(log.created_at)!;
      }
      if (log.weather_snapshot && typeof log.weather_snapshot === "object") {
        const ws = log.weather_snapshot as Record<string, unknown>;
        if (typeof ws.fetched_at === "string") {
          ws.fetched_at = shiftTimestamp(ws.fetched_at)!;
        }
      }
    }

    const profile = fixture.profile as Record<string, unknown>;
    if (typeof profile.streak_last_date === "string") {
      profile.streak_last_date = shiftDate(profile.streak_last_date);
    }
    if (typeof profile.updated_at === "string") {
      profile.updated_at = shiftTimestamp(profile.updated_at)!;
    }
    const tc = profile.trigger_cache as Record<string, unknown> | null;
    if (tc && typeof tc.computed_at === "string") {
      tc.computed_at = shiftTimestamp(tc.computed_at)!;
    }
  }

  try {
    const supabase = await createClient();

    // Clear existing demo data before re-seeding
    await supabase.from("log_entries").delete().eq("user_id", fixture.user.id);
    await supabase.from("saved_dishes").delete().eq("user_id", fixture.user.id);
    await supabase.from("user_profiles").delete().eq("user_id", fixture.user.id);
    await supabase.from("users").delete().eq("id", fixture.user.id);

    const { error: userErr } = await supabase
      .from("users")
      .insert(fixture.user);

    if (userErr) {
      console.error("[demo/seed] users upsert failed:", userErr);
      return errorResponse(`Failed to seed users table: ${userErr.message}`, 500);
    }

    const { error: profileErr } = await supabase
      .from("user_profiles")
      .insert(fixture.profile);

    if (profileErr) {
      console.error("[demo/seed] user_profiles insert failed:", profileErr);
      return errorResponse(`Failed to seed user_profiles table: ${profileErr.message}`, 500);
    }

    const { error: logsErr } = await supabase
      .from("log_entries")
      .insert(fixture.logs);

    if (logsErr) {
      console.error("[demo/seed] log_entries upsert failed:", logsErr);
      return errorResponse(`Failed to seed log_entries table: ${logsErr.message}`, 500);
    }

    const entries = fixture.logs.length;

    console.log(`[demo/seed] Seed complete — ${entries} log entries upserted`);
    return NextResponse.json({ seeded: true, entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown seed error";
    console.error("[demo/seed] Unexpected error:", err);
    return errorResponse(`Seed pipeline error: ${message}`, 500);
  }
}
