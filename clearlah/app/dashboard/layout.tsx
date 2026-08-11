import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import AppShell from "@/components/layout/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let streak = 0;
  try {
    const userId = await resolveApiUserId();
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("streak")
      .eq("user_id", userId)
      .maybeSingle();
    streak = profile?.streak ?? 0;
  } catch { /* non-critical */ }

  return <AppShell streak={streak}>{children}</AppShell>;
}
