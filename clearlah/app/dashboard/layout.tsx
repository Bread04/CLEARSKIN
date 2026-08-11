import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { isHighRiskDay } from "@/lib/utils/trigger-match";
import AppShell from "@/components/layout/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let streak = 0;
  let highRiskActive = false;
  try {
    const userId = await resolveApiUserId();
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("streak, trigger_cache")
      .eq("user_id", userId)
      .maybeSingle();
    streak = profile?.streak ?? 0;

    const triggerCache = profile?.trigger_cache as { top_triggers?: Array<{ factor: string }> } | null;
    const triggers = triggerCache?.top_triggers ?? [];

    const { count } = await supabase
      .from("log_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((count ?? 0) >= 7) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const weatherRes = await fetch(`${baseUrl}/api/weather`, { next: { revalidate: 300 } });
        let weather = { temp: 31, humidity: 82, psi: 45, uv: 9, source: "mock" };
        if (weatherRes.ok) weather = await weatherRes.json();
        highRiskActive = isHighRiskDay(triggers, weather).isHighRisk;
      } catch { /* non-critical */ }
    }
  } catch { /* non-critical */ }

  return <AppShell streak={streak} highRiskActive={highRiskActive}>{children}</AppShell>;
}
