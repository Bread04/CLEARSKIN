import { redirect } from "next/navigation";
import { isDemoMode, DEMO_USER_ID } from "@/lib/utils/demo";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo = isDemoMode();

  if (demo) {
    try {
      const supabase = await createClient();
      const { data: userRecord, error: queryError } = await supabase
        .from("users")
        .select("onboarding_complete")
        .eq("id", DEMO_USER_ID)
        .maybeSingle();

      if (queryError) {
        console.error("[ClearLah] Onboarding layout Supabase query error:", queryError.message);
      }

      if (userRecord?.onboarding_complete) {
        redirect("/dashboard");
      }
    } catch {
      // Supabase unreachable — show onboarding, don't crash
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {children}
    </div>
  );
}
