"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Condition } from "@/lib/types/database";
import { CONDITION_DISPLAY } from "@/lib/utils/pillars";
import { getAnonymousUserId } from "@/lib/utils/demo";
import PillarTag from "@/components/ui/PillarTag";

export default function OnboardingStep2() {
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [otherText, setOtherText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const cached = localStorage.getItem("clearlah_onboarding");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.conditions) && parsed.conditions.length > 0) {
          setSelectedConditions(
            parsed.conditions.filter((c: string) =>
              ["eczema", "ibs", "food_allergy", "asthma", "other"].includes(c)
            ) as Condition[]
          );
        }
        if (typeof parsed.otherText === "string") {
          setOtherText(parsed.otherText);
        }
      }
    } catch {
      // corrupted localStorage — ignore
    }
  }, []);

  const toggleCondition = useCallback((condition: Condition) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
    setError(null);
  }, []);

  const handleBack = useCallback(() => {
    router.push("/onboarding/step/1");
  }, [router]);

  const handleContinue = useCallback(async () => {
    if (selectedConditions.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions: selectedConditions, user_id: getAnonymousUserId() }),
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
            trackingFor: JSON.parse(
              localStorage.getItem("clearlah_onboarding") || "{}"
            ).trackingFor,
            conditions: selectedConditions,
            otherText: selectedConditions.includes("other") ? otherText : "",
            timestamp: Date.now(),
          })
        );
      } catch {
        // non-critical cache failure — server save succeeded, continue
      }

      router.push("/onboarding/step/3");
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }, [selectedConditions, otherText, router]);

  return (
    <div className="flex flex-col min-h-full px-4 py-8" role="main">
      <div className="flex-1 max-w-sm mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-heading-xl text-neutral-800">What are you tracking?</h1>
          <p className="text-body-md text-neutral-500">
            We&apos;ll personalise the language for your condition.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Select your health conditions">
          {CONDITION_DISPLAY.map((cond) => {
            const isSelected = selectedConditions.includes(cond.value);
            return (
              <PillarTag
                key={cond.value}
                pillar="symptoms"
                label={cond.label}
                selected={isSelected}
                onClick={() => toggleCondition(cond.value)}
              />
            );
          })}
        </div>

        {selectedConditions.includes("other") && (
          <div className="space-y-1">
            <label htmlFor="other-condition" className="block text-body-sm text-neutral-700">
              Describe your condition
            </label>
            <input
              id="other-condition"
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="e.g. psoriasis, chronic migraine"
              className="input"
              aria-label="Describe your condition"
              maxLength={100}
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="max-w-sm mx-auto w-full pt-8 space-y-3">
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
            onClick={handleContinue}
            disabled={selectedConditions.length === 0 || saving}
            className="btn-primary text-body-md w-full py-3 rounded-full min-h-[44px]"
            aria-disabled={selectedConditions.length === 0 || saving}
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>

        <p className="text-caption text-neutral-400 text-center">
          Step 2 of 3
        </p>
      </div>
    </div>
  );
}
