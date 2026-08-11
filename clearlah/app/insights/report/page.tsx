import { createClient } from "@/lib/supabase/server";
import { requireOnboardedUserId } from "@/lib/utils/user-server";
import ReportClient from "@/components/insights/ReportClient";
import type { DbLogEntry, DbUserProfile } from "@/lib/types/database";

export default async function ReportPage() {
  const supabase = await createClient();
  const userId = await requireOnboardedUserId();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: entries } = await supabase
    .from("log_entries")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(14);

  const triggerCache = (profile?.trigger_cache as Record<string, unknown>) ?? {};
  const topTriggers = (triggerCache.top_triggers as Array<Record<string, unknown>>) ?? [];

  return (
    <ReportClient
      conditions={profile?.conditions ?? []}
      topTriggers={topTriggers.map((t) => {
        const raw = (t.confidence ?? t.correlation ?? 0) as number;
        const confidence = raw <= 1 ? Math.round(raw * 100) : raw;
        return {
          trigger: (t.trigger ?? t.factor ?? "") as string,
          confidence,
        };
      })}
      entries={(entries ?? []) as DbLogEntry[]}
    />
  );
}
