"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAnonymousUserId } from "@/lib/utils/demo";

type TrackingFor = "myself" | "my_child" | "someone_else";

const CARDS: { value: TrackingFor; title: string; subtitle: string; emoji: string }[] = [
  {
    value: "myself",
    title: "Myself",
    subtitle: "I'm tracking my own symptoms and triggers",
    emoji: "🧑",
  },
  {
    value: "my_child",
    title: "My child",
    subtitle: "I'm helping my child manage their condition",
    emoji: "👶",
  },
  {
    value: "someone_else",
    title: "Someone else",
    subtitle: "I'm tracking for a family member or friend",
    emoji: "👤",
  },
];

export default function OnboardingStep1() {
  const [selected, setSelected] = useState<TrackingFor | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const cached = localStorage.getItem("clearlah_onboarding");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.trackingFor && ["myself", "my_child", "someone_else"].includes(parsed.trackingFor)) {
          setSelected(parsed.trackingFor as TrackingFor);
        }
      }
    } catch {
      // corrupted localStorage entry — ignore
    }
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_for: selected, user_id: getAnonymousUserId() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Something went wrong — try again");
        return;
      }

      try {
        localStorage.setItem(
          "clearlah_onboarding",
          JSON.stringify({ trackingFor: selected, timestamp: Date.now() })
        );
      } catch {
        // non-critical cache failure — server save succeeded, continue
      }

      router.push("/onboarding/step/2");
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }, [selected, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = (index + 1) % CARDS.length;
        const el = document.querySelector(`[data-card-index="${next}"]`) as HTMLElement | null;
        el?.focus();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = (index - 1 + CARDS.length) % CARDS.length;
        const el = document.querySelector(`[data-card-index="${prev}"]`) as HTMLElement | null;
        el?.focus();
      }
    },
    []
  );

  return (
    <div className="flex flex-col min-h-full px-4 py-8" role="main">
      <div className="flex-1 max-w-sm mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-heading-xl text-neutral-800">Who are you tracking for?</h1>
          <p className="text-body-md text-neutral-500">
            This helps us personalise your experience.
          </p>
        </div>

        <div className="space-y-3" role="radiogroup" aria-label="Who are you tracking for?">
          {CARDS.map((card, i) => {
            const isSelected = selected === card.value;
            return (
              <button
                key={card.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                data-card-index={i}
                 onClick={() => { setSelected(card.value); setError(null); }}
                onKeyDown={(e) => {
                   if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(card.value);
                    setError(null);
                  } else {
                    handleKeyDown(e, i);
                  }
                }}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-ui focus-visible:ring-2 focus-visible:ring-primary-sage focus-visible:ring-offset-2 min-h-[44px] ${
                  isSelected
                    ? "border-primary-sage bg-primary-sage-50"
                    : "border-neutral-300 bg-neutral-50 hover:border-neutral-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0" aria-hidden="true">
                    {card.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-body-lg text-neutral-800 font-semibold">
                      {card.title}
                    </span>
                    <span className="block text-body-sm text-neutral-500 mt-0.5">
                      {card.subtitle}
                    </span>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-6 h-6 text-primary-sage flex-shrink-0 mt-1 animate-fade-in"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
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

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || saving}
          className="btn-primary text-body-md w-full py-3 rounded-full min-h-[44px]"
          aria-disabled={!selected || saving}
        >
          {saving ? "Saving…" : "Continue"}
        </button>

        <p className="text-caption text-neutral-400 text-center">
          Step 1 of 3
        </p>
      </div>
    </div>
  );
}
