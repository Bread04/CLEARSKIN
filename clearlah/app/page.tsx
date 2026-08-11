import Link from "next/link";
import { redirect } from "next/navigation";
import { isDemoMode, DEMO_USER_ID } from "@/lib/utils/demo";
import { createClient } from "@/lib/supabase/server";
import DemoSeedButton from "@/components/DemoSeedButton";

export default async function LandingPage() {
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
        console.error("[ClearLah] Landing page Supabase query error:", queryError.message);
      }

      if (userRecord?.onboarding_complete) {
        redirect("/dashboard");
      }
    } catch (err) {
      console.error("[ClearLah] Landing page failed to query users table:", err);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-primary-sage-50 to-neutral-50">
      {demo && (
        <div className="w-full max-w-sm mb-6 rounded-lg border-2 border-secondary bg-secondary-light px-4 py-3 text-center">
          <span className="text-label text-secondary font-semibold">✦ Demo Mode</span>
          <p className="text-body-sm text-neutral-700 mt-1">
            Pre-loaded with 14 days of realistic eczema data.
          </p>
        </div>
      )}

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-sage to-primary-sage-dark rounded-2xl mb-4 shadow-card motion-safe:animate-celebration-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-9 h-9"
            aria-hidden="true"
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 19.5c-.03.05-.06.1-.08.14-.08.14-.16.28-.24.42L3 21l1.5.5C6 18 8 10 17 8z" />
            <path d="M17 8c0 0-7 0-9 7 1-1 3-2 5-2s4 1 4 1V8z" opacity=".5" />
          </svg>
        </div>
        <h1 className="text-display-md text-neutral-800 mb-2">ClearLah</h1>
        <p className="text-body-lg text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Track your triggers.
          <br />
          Live with less flare.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-sm mb-10">
        {[
          { icon: "💬", label: "AI-powered daily log — just describe your day", color: "border-l-4 border-l-primary-sage" },
          { icon: "🔍", label: "Spot your personal triggers automatically", color: "border-l-4 border-l-accent-lavender" },
          { icon: "🍜", label: "Singapore hawker food safety guide", color: "border-l-4 border-l-accent-sunshine" },
          { icon: "📈", label: "Insights to share with your doctor", color: "border-l-4 border-l-accent-sky" },
        ].map((feat) => (
          <div key={feat.label} className={`flex items-center gap-3 card px-4 py-3 ${feat.color}`}>
            <span className="text-xl" aria-hidden="true">
              {feat.icon}
            </span>
            <span className="text-body-md text-neutral-700">{feat.label}</span>
          </div>
        ))}
      </div>

      {demo ? (
        <DemoSeedButton />
      ) : (
        <Link href="/onboarding/step/1" className="btn-primary text-body-md w-full max-w-sm py-3 rounded-lg">
          Get Started
        </Link>
      )}

      <p className="text-label-sm text-neutral-400 mt-4 text-center">
        For eczema, IBS, food allergy & asthma tracking.
        <br />
        Not a medical diagnostic tool.
      </p>
    </main>
  );
}
