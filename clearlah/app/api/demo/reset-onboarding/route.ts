import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, DEMO_USER_ID } from "@/lib/utils/demo";

export const runtime = "nodejs";

/**
 * POST /api/demo/reset-onboarding
 *
 * Puts the demo user back into the onboarding flow so a presenter can walk the
 * full journey (tracking-for → conditions → disclaimer) live. Keeps the 14 days
 * of seeded logs and the profile (conditions, allergens) intact so that, after
 * onboarding completes, the dashboard still shows the pre-loaded insights.
 *
 * Security: only responds when NEXT_PUBLIC_DEMO_MODE is true.
 */
export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json(
      { reset: false, error: "Reset is only available in demo mode" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const { error: userErr } = await supabase
      .from("users")
      .update({ onboarding_complete: false })
      .eq("id", DEMO_USER_ID);

    if (userErr) {
      console.error("[demo/reset-onboarding] users update failed:", userErr.message);
      return NextResponse.json({ reset: false, error: userErr.message }, { status: 500 });
    }

    const { error: profileErr } = await supabase
      .from("user_profiles")
      .update({ disclaimer_acknowledged: false })
      .eq("user_id", DEMO_USER_ID);

    if (profileErr) {
      console.error("[demo/reset-onboarding] profile update failed:", profileErr.message);
      return NextResponse.json({ reset: false, error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ reset: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[demo/reset-onboarding] unexpected error:", e);
    return NextResponse.json({ reset: false, error: message }, { status: 500 });
  }
}
