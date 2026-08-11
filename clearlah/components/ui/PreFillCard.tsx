"use client";

import { useState, useCallback, useRef } from "react";
import type { ParsedLog, Condition } from "@/lib/types/database";
import type { Suggestion } from "@/lib/utils/suggestions";
import { getSymptomPillarLabel } from "@/lib/utils/pillars";
import ManualLogForm from "@/components/ui/ManualLogForm";

interface PreFillCardProps {
  parsedLog: ParsedLog;
  conditions: string[];
  suggestions?: Suggestion[];
  userMessage?: string;
  onConfirm: (data: ParsedLog) => void;
}

export default function PreFillCard({
  parsedLog: raw,
  conditions,
  suggestions,
  userMessage,
  onConfirm,
}: PreFillCardProps) {
  const parsedLog: ParsedLog = {
    food: raw.food ?? { items: [], hawker_dishes: [] },
    lifestyle: raw.lifestyle ?? {
      sleep_hours: null,
      stress_level: null,
      stress_type: null,
      exercise_minutes: null,
      water_ml: null,
      caffeine_cups: null,
      alcohol_drinks: null,
    },
    skincare: raw.skincare ?? null,
    symptoms: raw.symptoms ?? { skin: null, gut: null, respiratory: null },
    summary: raw.summary ?? "",
  };
  const [showFullForm, setShowFullForm] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const feedbackSent = useRef(false);
  const symptomLabel = getSymptomPillarLabel(conditions as Condition[]);

  const sendFeedback = useCallback(async (rating: "accurate" | "inaccurate", corrections?: Record<string, unknown>) => {
    if (feedbackSent.current) return;
    feedbackSent.current = true;

    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_message: userMessage ?? "",
          parsed_result: parsedLog,
          rating,
          corrections: corrections ?? null,
        }),
      });
    } catch {
      // non-critical
    }
  }, [userMessage, parsedLog]);

  const handleConfirm = useCallback(() => {
    sendFeedback("accurate");
    setFeedbackGiven(true);
    setFeedbackMessage("Thanks! This helps me learn your patterns.");
    setTimeout(() => onConfirm(parsedLog), 1200);
  }, [sendFeedback, onConfirm, parsedLog]);

  const handleInaccurate = useCallback(() => {
    setShowFullForm(true);
  }, []);

  const handleCorrectedConfirm = useCallback((data: ParsedLog) => {
    sendFeedback("inaccurate", { corrected: data });
    setFeedbackGiven(true);
    setFeedbackMessage("Got it — I'll do better next time.");
    setTimeout(() => {
      setShowFullForm(false);
      onConfirm(data);
    }, 1200);
  }, [sendFeedback, onConfirm]);

  if (feedbackGiven) {
    return (
      <div className="card rounded-xl p-4 bg-primary-sage-50 border border-primary-sage/30 motion-safe:animate-fade-in-up text-center">
        <p className="text-body-md text-primary-sage font-medium">{feedbackMessage}</p>
      </div>
    );
  }

  if (showFullForm) {
    return (
      <div className="card rounded-xl p-4 motion-safe:animate-fade-in-up">
        <ManualLogForm
          initial={parsedLog}
          conditions={conditions}
          suggestions={suggestions}
          onConfirm={handleCorrectedConfirm}
          onCancel={() => setShowFullForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="card rounded-xl p-4 space-y-3 motion-safe:animate-fade-in-up">
      <p className="text-body-sm text-neutral-500">
        Here&apos;s what I heard — review before saving
      </p>

      {parsedLog.food.items.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16 flex-shrink-0 pt-0.5">Food</span>
          <div className="flex flex-wrap gap-1">
            {parsedLog.food.items.map((item) => (
              <span key={item} className="pill-sage text-caption">{item}</span>
            ))}
          </div>
        </div>
      )}

      {parsedLog.lifestyle.sleep_hours !== null && (
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16">Sleep</span>
          <span className="text-body-sm text-neutral-800">{parsedLog.lifestyle.sleep_hours}h</span>
        </div>
      )}

      {parsedLog.lifestyle.stress_level !== null && (
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16">Stress</span>
          <span className="text-body-sm text-neutral-800">
            {parsedLog.lifestyle.stress_level}/5
            {parsedLog.lifestyle.stress_type && ` · ${parsedLog.lifestyle.stress_type}`}
          </span>
        </div>
      )}

      {parsedLog.lifestyle.exercise_minutes != null && (
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16">Exercise</span>
          <span className="text-body-sm text-neutral-800">{parsedLog.lifestyle.exercise_minutes} min</span>
        </div>
      )}

      {parsedLog.lifestyle.water_ml != null && (
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16">Water</span>
          <span className="text-body-sm text-neutral-800">{parsedLog.lifestyle.water_ml} ml</span>
        </div>
      )}

      {parsedLog.lifestyle.caffeine_cups != null && (
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16">Caffeine</span>
          <span className="text-body-sm text-neutral-800">{parsedLog.lifestyle.caffeine_cups} cup{parsedLog.lifestyle.caffeine_cups !== 1 ? "s" : ""}</span>
        </div>
      )}

      {parsedLog.lifestyle.alcohol_drinks != null && (
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16">Alcohol</span>
          <span className="text-body-sm text-neutral-800">{parsedLog.lifestyle.alcohol_drinks} drink{parsedLog.lifestyle.alcohol_drinks !== 1 ? "s" : ""}</span>
        </div>
      )}

      {parsedLog.skincare && (
        <div className="flex items-start gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16 flex-shrink-0 pt-0.5">Skincare</span>
          <span className="text-body-sm text-neutral-800">{parsedLog.skincare}</span>
        </div>
      )}

      {(parsedLog.symptoms.skin != null || parsedLog.symptoms.gut != null || parsedLog.symptoms.respiratory != null) && (
        <div className="flex items-start gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16 flex-shrink-0 pt-0.5">{symptomLabel}</span>
          <div className="space-y-0.5">
            {parsedLog.symptoms.skin != null && <div className="text-body-sm text-neutral-800">Skin: {parsedLog.symptoms.skin}/10</div>}
            {parsedLog.symptoms.gut != null && <div className="text-body-sm text-neutral-800">Gut: {parsedLog.symptoms.gut}/10</div>}
            {parsedLog.symptoms.respiratory != null && <div className="text-body-sm text-neutral-800">Respiratory: {parsedLog.symptoms.respiratory}/10</div>}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2 items-center">
        <button
          type="button"
          onClick={handleConfirm}
          className="btn-primary text-body-sm flex-1 min-h-[44px] py-2 rounded-full"
        >
          Looks right — save
        </button>
        <button
          type="button"
          onClick={handleInaccurate}
          className="btn-ghost text-body-sm min-h-[44px] px-4 rounded-full flex items-center gap-1"
          aria-label="Not accurate — let me fix"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
          </svg>
          Fix it
        </button>
        <button
          type="button"
          onClick={handleInaccurate}
          className="btn-ghost text-body-sm min-h-[44px] px-3 rounded-full flex items-center gap-1"
          aria-label="Not accurate"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M22 2H2v13.32l5.17-4.29 4.46 3.7 6.39-7.73L22 11.24V2zM2 22h10v-2H2v2zm12-2h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2z"/>
          </svg>
          Not quite
        </button>
      </div>
    </div>
  );
}
