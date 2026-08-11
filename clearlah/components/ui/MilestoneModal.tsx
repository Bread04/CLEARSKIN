"use client";

import { useEffect, useRef } from "react";

interface MilestoneModalProps {
  milestone: number;
  onDismiss: () => void;
}

const MILESTONE_MESSAGES: Record<number, { message: string; emojis: string[] }> = {
  3: { message: "3 days in a row! You're building a habit.", emojis: ["🌱", "✨", "💪"] },
  7: { message: "One week of tracking! Your first insights are near.", emojis: ["📊", "🔍", "🎯"] },
  14: { message: "Two weeks strong — patterns are taking shape.", emojis: ["🔥", "🧩", "💚"] },
  21: { message: "Three weeks! This is becoming second nature.", emojis: ["🏆", "🌟", "🎉"] },
  30: { message: "A full month! Your health detective work is paying off.", emojis: ["🕵️", "💎", "👑"] },
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

  const milestoneData = MILESTONE_MESSAGES[milestone] ?? {
    message: `${milestone} days — amazing work!`,
    emojis: ["🎉", "🔥", "💪"],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 motion-safe:animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${milestone} day streak milestone`}
        className="card rounded-xl p-8 max-w-sm mx-4 text-center motion-safe:animate-fade-in-up border-t-4 border-t-secondary"
      >
        <div className="flex justify-center gap-3 mb-3 text-2xl" aria-hidden="true">
          {milestoneData.emojis.map((e, i) => (
            <span key={i} className="motion-safe:animate-celebration-bounce" style={{ animationDelay: `${i * 150}ms` }}>{e}</span>
          ))}
        </div>
        <p className="text-numeric text-secondary mb-2">{milestone}</p>
        <p className="text-h3 text-neutral-800 mb-1">Day Streak 🔥</p>
        <p className="text-body-md text-neutral-600 mb-6">
          {milestoneData.message}
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
