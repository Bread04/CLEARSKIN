import type { Condition } from "@/lib/types/database";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthenticatedError } from "@/lib/utils/demo";
import { resolveApiUserId } from "@/lib/utils/user-server";
import type { TrackingFor } from "@/lib/types/database";

const VALID_TRACKING: TrackingFor[] = ["myself", "my_child", "someone_else"];
const VALID_CONDITIONS: Condition[] = ["eczema", "ibs", "food_allergy", "asthma", "other"];

export async function GET() {
  try {
    const userId = await resolveApiUserId();
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({ success: true, profile: profile ?? {} });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (e instanceof Error && "digest" in e) throw e;
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: {
      tracking_for?: unknown;
      conditions?: unknown;
      disclaimer_acknowledged?: unknown;
      known_allergens?: unknown;
      daily_skincare?: unknown;
      onboarding_step?: unknown;
      singlish_unlocked?: unknown;
      location_enabled?: unknown;
      community_sharing?: unknown;
      user_id?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body — expected valid JSON" },
        { status: 400 }
      );
    }

    const userId = await resolveApiUserId(
      typeof body.user_id === "string" ? body.user_id : undefined
    );

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Request body is required" },
        { status: 400 }
      );
    }

    const hasTrackingFor = typeof body.tracking_for === "string";
    const hasConditions = Array.isArray(body.conditions);
    const hasDisclaimer = body.disclaimer_acknowledged === true;
    const hasAllergens = Array.isArray(body.known_allergens);
    const hasSkincare = typeof body.daily_skincare === "string" || body.daily_skincare === null;
    const hasOnboardingStep = typeof body.onboarding_step === "number";
    const hasSinglish = body.singlish_unlocked === true || body.singlish_unlocked === false;
    const hasLocationEnabled = body.location_enabled === true || body.location_enabled === false;
    const hasCommunitySharing = body.community_sharing === true || body.community_sharing === false;

    if (!hasTrackingFor && !hasConditions && !hasDisclaimer &&
        !hasAllergens && !hasSkincare && !hasOnboardingStep && !hasSinglish &&
        !hasLocationEnabled && !hasCommunitySharing) {
      return NextResponse.json(
        { success: false, error: "Provide tracking_for, conditions, disclaimer_acknowledged, known_allergens, daily_skincare, onboarding_step, or a combination" },
        { status: 400 }
      );
    }

    if (hasTrackingFor && !VALID_TRACKING.includes(body.tracking_for as TrackingFor)) {
      return NextResponse.json(
        { success: false, error: "tracking_for must be 'myself', 'my_child', or 'someone_else'" },
        { status: 400 }
      );
    }

    if (hasConditions) {
      const conditions = body.conditions as unknown[];
      if (conditions.length === 0 || !conditions.every((c) => typeof c === "string" && VALID_CONDITIONS.includes(c as Condition))) {
        return NextResponse.json(
          { success: false, error: "conditions must be an array of valid condition strings" },
          { status: 400 }
        );
      }
    }

    if (hasAllergens) {
      const allergens = body.known_allergens as unknown[];
      if (!allergens.every((a) => typeof a === "string")) {
        return NextResponse.json(
          { success: false, error: "known_allergens must be an array of strings" },
          { status: 400 }
        );
      }
    }

    if (hasSkincare && typeof body.daily_skincare !== "string" && body.daily_skincare !== null) {
      return NextResponse.json(
        { success: false, error: "daily_skincare must be a string or null" },
        { status: 400 }
      );
    }

    if (hasOnboardingStep) {
      const step = body.onboarding_step as number;
      if (!Number.isFinite(step) || step < 1 || step > 3 || !Number.isInteger(step)) {
        return NextResponse.json(
          { success: false, error: "onboarding_step must be 1, 2, or 3" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (hasTrackingFor) updateData.tracking_for = body.tracking_for as TrackingFor;
    if (hasConditions) updateData.conditions = body.conditions as Condition[];
    if (hasDisclaimer) updateData.disclaimer_acknowledged = true;
    if (hasAllergens) updateData.known_allergens = body.known_allergens as string[];
    if (hasSkincare) updateData.daily_skincare = body.daily_skincare as string | null;
    if (hasOnboardingStep) {
      updateData.onboarding_step = body.onboarding_step as number;
      const step = body.onboarding_step as number;
      if (step >= 3) {
        updateData.singlish_unlocked = true;
      } else {
        updateData.singlish_unlocked = false;
      }
    }
    if (hasSinglish) updateData.singlish_unlocked = body.singlish_unlocked as boolean;
    if (hasLocationEnabled) updateData.location_enabled = body.location_enabled as boolean;
    if (hasCommunitySharing) updateData.community_sharing = body.community_sharing as boolean;

    const supabase = await createClient();

    // Ensure users row exists for the anonymous user
    await supabase.from("users").upsert(
      { id: userId },
      { onConflict: "id", ignoreDuplicates: false }
    );

    const { error: upsertError } = await supabase
      .from("user_profiles")
      .upsert(updateData, { onConflict: "user_id" });

    if (upsertError) {
      console.error("[ClearLah] Profile upsert failed:", upsertError.message);
      return NextResponse.json(
        { success: false, error: "Could not save your selection. Please try again." },
        { status: 500 }
      );
    }

    if (hasDisclaimer) {
      // verify tracking_for exists before allowing disclaimer completion
      if (!hasTrackingFor) {
        const { data: existing } = await supabase
          .from("user_profiles")
          .select("tracking_for")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existing?.tracking_for) {
          return NextResponse.json(
            { success: false, error: "Please complete step 1 (tracking for) first" },
            { status: 400 }
          );
        }
      }

      const { error: userError } = await supabase
        .from("users")
        .update({ onboarding_complete: true })
        .eq("id", userId);

      if (userError) {
        console.error("[ClearLah] users onboarding_complete update failed:", userError.message);
        return NextResponse.json(
          { success: false, error: "Could not complete onboarding. Please try again." },
          { status: 500 }
        );
      }

      const { data: verify } = await supabase
        .from("users")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle();

      if (!verify || !verify.onboarding_complete) {
        console.error("[ClearLah] users onboarding_complete verify failed: row not found or still false");
        return NextResponse.json(
          { success: false, error: "Could not complete onboarding. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        user_id: userId,
        ...(hasTrackingFor && { tracking_for: body.tracking_for as TrackingFor }),
        ...(hasConditions && { conditions: body.conditions as Condition[] }),
        ...(hasDisclaimer && { disclaimer_acknowledged: true }),
        ...(hasAllergens && { known_allergens: body.known_allergens as string[] }),
        ...(hasSkincare && { daily_skincare: body.daily_skincare as string | null }),
        ...(hasOnboardingStep && {
          onboarding_step: body.onboarding_step as number,
          singlish_unlocked: (body.onboarding_step as number) >= 3,
        }),
      },
    });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (e instanceof Error && "digest" in e) throw e;

    console.error("[ClearLah] POST /api/profile unexpected error:", e);
    return NextResponse.json(
      { success: false, error: "Something went wrong on our end — try again in a sec?" },
      { status: 500 }
    );
  }
}
