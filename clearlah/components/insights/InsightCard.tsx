"use client";

import { useState } from "react";
import PillarTag from "@/components/ui/PillarTag";
import type { Pillar } from "@/lib/pattern-engine";

interface InsightCardProps {
  trigger: string;
  pillar: Pillar;
  confidence: number;
  narration: string;
  affectedDays: string[];
  index: number;
}

export default function InsightCard({
  trigger,
  pillar,
  confidence,
  narration,
  affectedDays,
  index,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-primary-sage-50 border-l-4 border-primary-sage rounded-md p-6 motion-safe:animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-h3 text-neutral-800">{trigger}</h3>
        <span className="text-numeric text-primary-sage shrink-0 ml-4">
          {confidence}%
        </span>
      </div>

      <p className="text-body-lg text-neutral-600 mb-3">{narration}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        <PillarTag pillar={pillar} label={pillar} />
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="text-body-sm text-primary-sage hover:text-primary-sage-dark underline transition-colors"
      >
        {expanded ? "Hide evidence" : "See evidence"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-primary-sage/20 space-y-1">
          {affectedDays.slice(0, 5).map((date) => (
            <div key={date} className="text-body-sm text-neutral-500">
              {new Date(date).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "short",
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
