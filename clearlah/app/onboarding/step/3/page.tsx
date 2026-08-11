"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSymptomPillarLabel } from "@/lib/utils/pillars";
import { getAnonymousUserId } from "@/lib/utils/demo";
import type { Condition } from "@/lib/types/database";

export default function OnboardingStep3() {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pillarLabel, setPillarLabel] = useState("Symptoms");
  const router = useRouter();

  useEffect(() => {
    try {
      const cached = localStorage.getItem("clearlah_onboarding");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.conditions) && parsed.conditions.length > 0) {
          setPillarLabel(getSymptomPillarLabel(parsed.conditions as Condition[]));
        }
      }
    } catch {
      // ignore corrupted cache
    }
  }, []);

  const handleBack = useCallback(() => {
    router.push("/onboarding/step/2");
  }, [router]);

  const handleComplete = useCallback(async () => {
    if (!checked) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disclaimer_acknowledged: true, user_id: getAnonymousUserId() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Something went wrong — try again");
        return;
      }

      try {
        localStorage.setItem(
          "clearlah_onboarding",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("clearlah_onboarding") || "{}"),
            disclaimerAcknowledged: true,
            timestamp: Date.now(),
          })
        );
      } catch {
        // non-critical cache failure
      }

      router.push("/dashboard");
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }, [checked, router]);

  return (
    <div className="flex flex-col min-h-full px-4 py-8" role="main">
      <div className="flex-1 max-w-sm mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-heading-xl text-neutral-800">Almost there</h1>
          <p className="text-body-md text-neutral-500">
            One last thing before we personalise your{" "}
            <span className="font-semibold text-neutral-700">{pillarLabel}</span> tracker.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-heading-md text-neutral-800 mb-3">Medical Disclaimer</h2>
          <p className="text-body-md text-neutral-600 leading-relaxed">
            ClearLah helps you track patterns in your symptoms and lifestyle. It
            is not a medical diagnostic tool. Always consult a qualified
            healthcare professional for diagnosis and treatment.
          </p>
        </div>
      </div>

      <div className="max-w-sm mx-auto w-full pt-8 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              setError(null);
            }}
            className="mt-0.5 h-5 w-5 rounded accent-primary-sage flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary-sage focus-visible:ring-offset-2"
          />
          <span className="text-body-sm text-neutral-700 group-hover:text-neutral-800 transition-colors">
            I understand — ClearLah is a tracking tool, not a doctor
          </span>
        </label>

        {error && (
          <div
            role="alert"
            className="rounded-lg border-l-4 border-status-error bg-status-error-bg px-4 py-3 text-body-sm text-neutral-800"
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="btn-ghost rounded-full min-h-[44px] px-6 text-body-md flex-shrink-0"
            aria-label="Go back"
          >
            ←&nbsp;Back
          </button>

          <button
            type="button"
            onClick={handleComplete}
            disabled={!checked || saving}
            className="btn-primary text-body-md w-full py-3 rounded-full min-h-[44px]"
            aria-disabled={!checked || saving}
          >
            {saving ? "Saving…" : "Let's go"}
          </button>
        </div>

        <p className="text-caption text-neutral-400 text-center">
          Step 3 of 3
        </p>
      </div>
    </div>
  );
}
