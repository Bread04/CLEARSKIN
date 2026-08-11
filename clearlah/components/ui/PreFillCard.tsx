"use client";

import { useState, useCallback } from "react";
import type { ParsedLog, Condition } from "@/lib/types/database";
import type { Suggestion } from "@/lib/utils/suggestions";
import { getSymptomPillarLabel } from "@/lib/utils/pillars";
import ManualLogForm from "@/components/ui/ManualLogForm";

interface PreFillCardProps {
  parsedLog: ParsedLog;
  conditions: string[];
  suggestions?: Suggestion[];
  onConfirm: (data: ParsedLog) => void;
}

export default function PreFillCard({
  parsedLog,
  conditions,
  suggestions,
  onConfirm,
}: PreFillCardProps) {
  const [showFullForm, setShowFullForm] = useState(false);
  const symptomLabel = getSymptomPillarLabel(conditions as Condition[]);

  if (showFullForm) {
    return (
      <div className="card rounded-xl p-4 motion-safe:animate-fade-in-up">
        <ManualLogForm
          initial={parsedLog}
          conditions={conditions}
          suggestions={suggestions}
          onConfirm={(data) => {
            setShowFullForm(false);
            onConfirm(data);
          }}
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

      {parsedLog.skincare && (
        <div className="flex items-start gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16 flex-shrink-0 pt-0.5">Skincare</span>
          <span className="text-body-sm text-neutral-800">{parsedLog.skincare}</span>
        </div>
      )}

      {(parsedLog.symptoms.skin || parsedLog.symptoms.gut || parsedLog.symptoms.respiratory) && (
        <div className="flex items-start gap-2">
          <span className="text-label-sm font-semibold text-neutral-500 w-16 flex-shrink-0 pt-0.5">{symptomLabel}</span>
          <div className="space-y-0.5">
            {parsedLog.symptoms.skin && <div className="text-body-sm text-neutral-800">Skin: {parsedLog.symptoms.skin}/10</div>}
            {parsedLog.symptoms.gut && <div className="text-body-sm text-neutral-800">Gut: {parsedLog.symptoms.gut}/10</div>}
            {parsedLog.symptoms.respiratory && <div className="text-body-sm text-neutral-800">Respiratory: {parsedLog.symptoms.respiratory}/10</div>}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onConfirm(parsedLog)}
          className="btn-primary text-body-sm flex-1 min-h-[44px] py-2 rounded-full"
        >
          Confirm &amp; Save
        </button>
        <button
          type="button"
          onClick={() => setShowFullForm(true)}
          className="btn-ghost text-body-sm min-h-[44px] px-4 rounded-full"
          aria-label="Edit more details"
        >
          Edit more
        </button>
      </div>
    </div>
  );
}
