"use client";

import { EVIDENCE_LABELS, type EatClearFood } from "@/lib/eat-clear";

interface EatClearCardProps {
  foods: EatClearFood[];
}

const TIER_STYLES: Record<string, string> = {
  strong: "bg-primary-sage-50 text-primary-sage-dark",
  moderate: "bg-status-success-bg text-status-success",
  emerging: "bg-status-info-bg text-status-info",
  traditional: "bg-neutral-100 text-neutral-500",
};

export default function EatClearCard({ foods }: EatClearCardProps) {
  if (foods.length === 0) return null;

  return (
    <div className="card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span aria-hidden="true" className="text-lg">🥗</span>
        <h2 className="text-h3 text-neutral-800">Foods to eat</h2>
      </div>
      <p className="text-body-sm text-neutral-500 mb-3">
        Personalised, anti-inflammatory picks to support your skin — not just what to avoid.
      </p>

      <ul className="space-y-3">
        {foods.map((food) => (
          <li key={food.id} className="border-b border-neutral-100 last:border-0 pb-3 last:pb-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-body-md font-medium text-neutral-800">{food.nutrient}</p>
              <span className={`text-caption px-2 py-0.5 rounded-full shrink-0 ${TIER_STYLES[food.evidence] || "bg-neutral-100 text-neutral-500"}`}>
                {EVIDENCE_LABELS[food.evidence]}
              </span>
            </div>
            <p className="text-body-sm text-neutral-600 mb-1">{food.benefit}</p>
            <p className="text-caption text-neutral-500">{food.examples.join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
