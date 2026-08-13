import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthenticatedError } from "@/lib/utils/demo";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { detectCorrelations } from "@/lib/pattern-engine";

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const userId = await resolveApiUserId(userIdParam ?? undefined);

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("trigger_cache, conditions")
      .eq("user_id", userId)
      .maybeSingle();

    const { count: logCount } = await supabase
      .from("log_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const entryCount = logCount ?? 0;

    if (entryCount < 7) {
      return NextResponse.json({
        status: "insufficient_data",
        entries_needed: 7 - entryCount,
      });
    }

    const cached = profile?.trigger_cache as Record<string, unknown> | null;
    if (cached && typeof cached.computed_at === "string" && typeof cached.entry_count === "number") {
      const age = Date.now() - new Date(cached.computed_at).getTime();
      if (age < CACHE_TTL && cached.entry_count === entryCount) {
        return NextResponse.json({
          status: "ok",
          correlations: cached.top_triggers ?? [],
          lastUpdated: cached.computed_at,
        });
      }
    }

    const { data: entries } = await supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false });

    const result = detectCorrelations(entries ?? []);

    if ("status" in result && result.status === "insufficient_data") {
      return NextResponse.json(result);
    }

    const correlations = result as import("@/lib/pattern-engine").CorrelationResult[];

    // Store the canonical TriggerEntry shape (factor/correlation/occurrences)
    // so downstream consumers (identify-dish, clearcart, dashboard) don't hit
    // undefined fields. The pattern engine emits `trigger`, which consumers
    // expect as `factor`.
    const conditions = Array.isArray(profile?.conditions) ? profile.conditions : [];
    const condition = (conditions[0] as string) || "other";

    const triggerCache = {
      computed_at: new Date().toISOString(),
      entry_count: entryCount,
      top_triggers: correlations.map((c) => ({
        factor: c.trigger,
        correlation: c.confidence / 100,
        occurrences: c.cooccurrence_count,
        condition,
      })),
    };

    await supabase
      .from("user_profiles")
      .upsert(
        { user_id: userId, trigger_cache: triggerCache, updated_at: new Date().toISOString() },
      { onConflict: "user_id", ignoreDuplicates: false }
    );

    return NextResponse.json({
      status: "ok",
      correlations,
      lastUpdated: triggerCache.computed_at,
    });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json(
        { status: "insufficient_data", entries_needed: 7 },
        { status: 401 }
      );
    }
    if (e instanceof Error && "digest" in e) throw e;
    console.error("[ClearLah] GET /api/insights/correlate error:", e);
    return NextResponse.json(
      { status: "insufficient_data", entries_needed: 7 },
      { status: 500 }
    );
  }
}
