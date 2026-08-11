"use client";

import { useEffect, useRef } from "react";

interface MilestoneModalProps {
  milestone: number;
  onDismiss: () => void;
}

const MILESTONE_MESSAGES: Record<number, string> = {
  3: "3 days in a row! You're building a habit.",
  7: "One week of tracking! Your first insights are near.",
  14: "Two weeks strong — patterns are taking shape.",
  21: "Three weeks! This is becoming second nature.",
  30: "A full month! Your health detective work is paying off.",
};

export default function MilestoneModal({
  milestone,
  onDismiss,
}: MilestoneModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
      if (e.key === "Tab") {
        const focusable = document.querySelectorAll<HTMLElement>(
          '[role="dialog"] button, [role="dialog"] [tabindex]'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 motion-safe:animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${milestone} day streak milestone`}
        className="card rounded-xl p-8 max-w-sm mx-4 text-center motion-safe:animate-fade-in-up"
      >
        <p className="text-numeric mb-2">🔥 {milestone}</p>
        <p className="text-h3 text-neutral-800 mb-1">Day Streak</p>
        <p className="text-body-md text-neutral-600 mb-6">
          {MILESTONE_MESSAGES[milestone] || `${milestone} days — amazing work!`}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onDismiss}
          className="btn-primary text-body-md py-3 px-8 rounded-full"
          aria-label="Dismiss milestone"
        >
          Keep going
        </button>
      </div>
    </div>
  );
}
