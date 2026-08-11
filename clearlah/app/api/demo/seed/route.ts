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

  try {
    const supabase = await createClient();

    const { error: userErr } = await supabase
      .from("users")
      .upsert(fixture.user, { onConflict: "id" });

    if (userErr) {
      console.error("[demo/seed] users upsert failed:", userErr);
      return errorResponse(`Failed to seed users table: ${userErr.message}`, 500);
    }

    const { error: profileErr } = await supabase
      .from("user_profiles")
      .upsert(fixture.profile, { onConflict: "user_id" });

    if (profileErr) {
      console.error("[demo/seed] user_profiles upsert failed:", profileErr);
      return errorResponse(`Failed to seed user_profiles table: ${profileErr.message}`, 500);
    }

    const { error: logsErr } = await supabase
      .from("log_entries")
      .upsert(fixture.logs, {
        onConflict: "user_id, logged_at",
      });

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
