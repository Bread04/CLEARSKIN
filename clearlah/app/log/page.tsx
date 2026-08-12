import { createClient } from "@/lib/supabase/server";
import { requireOnboardedUserId } from "@/lib/utils/user-server";
import ChatInterface from "@/components/ui/ChatInterface";
import LogHeaderActions from "@/components/hawker/LogHeaderActions";

async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("tracking_for, conditions, singlish_unlocked, onboarding_step, known_allergens, daily_skincare")
    .eq("user_id", userId)
    .maybeSingle();

  const { count } = await supabase
    .from("log_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    trackingFor: data?.tracking_for ?? "myself",
    conditions: data?.conditions ?? [],
    singlishUnlocked: data?.singlish_unlocked ?? false,
    onboardingStep: data?.onboarding_step ?? 1,
    knownAllergens: data?.known_allergens ?? [],
    dailySkincare: data?.daily_skincare ?? null,
    logCount: count ?? 0,
  };
}

export default async function LogPage() {
  const userId = await requireOnboardedUserId();
  const profile = await getProfile(userId);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center">
          <a
            href="/dashboard"
            aria-label="Back to dashboard"
            className="btn-ghost rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </a>
          <h1 className="text-h3 text-neutral-800 ml-2">Log Today</h1>
        </div>
        <LogHeaderActions />
      </header>

      <ChatInterface
        trackingFor={profile.trackingFor}
        conditions={profile.conditions}
        singlishUnlocked={profile.singlishUnlocked}
        logCount={profile.logCount}
        onboardingStep={profile.onboardingStep}
        knownAllergens={profile.knownAllergens}
        dailySkincare={profile.dailySkincare}
      />
    </div>
  );
}
