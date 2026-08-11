import { createClient } from "@/lib/supabase/server";
import { requireOnboardedUserId } from "@/lib/utils/user-server";
import { isHighRiskDay } from "@/lib/utils/trigger-match";
import { cookies } from "next/headers";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const userId = await requireOnboardedUserId();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("streak, streak_last_date, singlish_unlocked, trigger_cache")
    .eq("user_id", userId)
    .maybeSingle();

  const demoOffset = parseInt(
    (await cookies()).get("clearlah_demo_day_offset")?.value ?? "0",
    10
  ) || 0;
  const baseDate = new Date();
  if (demoOffset > 0) baseDate.setDate(baseDate.getDate() + demoOffset);
  const today = baseDate.toISOString().split("T")[0];
  const yesterdayDate = new Date(today + "T00:00:00");
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  let streak = profile?.streak ?? 0;
  if (profile?.streak_last_date && profile.streak_last_date < yesterday) {
    streak = 0;
    await supabase.from("user_profiles").upsert(
      { user_id: userId, streak: 0, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  const { count } = await supabase
    .from("log_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const logCount = count ?? 0;
  const triggerCache = profile?.trigger_cache as { top_triggers?: Array<{ factor: string; correlation: number; occurrences: number; condition: string }> } | null;
  const triggers = triggerCache?.top_triggers ?? [];

  let weather = { temp: 31, humidity: 82, psi: 45, uv: 9, source: "mock" };
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const weatherRes = await fetch(`${baseUrl}/api/weather`, { next: { revalidate: 300 } });
    if (weatherRes.ok) weather = await weatherRes.json();
  } catch { /* fall back to mock */ }

  const riskResult = logCount >= 7
    ? isHighRiskDay(triggers, weather)
    : { isHighRisk: false, matchedTriggers: [], summary: "" };

  return (
    <DashboardClient
      streak={streak}
      logCount={logCount}
      singlishUnlocked={profile?.singlish_unlocked ?? false}
      highRiskActive={riskResult.isHighRisk}
      triggerSummary={riskResult.summary}
    />
  );
}
