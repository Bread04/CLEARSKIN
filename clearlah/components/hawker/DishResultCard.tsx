"use client";

import PillarTag from "@/components/ui/PillarTag";

type RiskLevel = "high" | "moderate" | "safe" | "unknown";

interface DishResultCardProps {
  id: string;
  nameEn: string;
  nameMs: string | null;
  nameZh: string | null;
  allergens: string[];
  riskLevel: RiskLevel;
  riskReason: string;
  savedLabel?: string | null;
  onSave: (dishId: string, label: string) => void;
  saving: boolean;
}

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-secondary-terracotta-50", text: "text-secondary-terracotta-dark", label: "High Risk" },
  moderate: { bg: "bg-status-warning-bg", text: "text-status-warning", label: "Moderate" },
  safe: { bg: "bg-primary-sage-50", text: "text-primary-sage-dark", label: "Safe" },
  unknown: { bg: "bg-neutral-100", text: "text-neutral-500", label: "Unknown — keep logging" },
};

const SAVE_LABELS = [
  { value: "safe", label: "Safe", className: "bg-primary-sage-50 text-primary-sage-dark hover:bg-primary-sage-100" },
  { value: "risky", label: "Risky", className: "bg-status-warning-bg text-status-warning hover:bg-orange-100" },
  { value: "avoid", label: "Avoid", className: "bg-secondary-terracotta-50 text-secondary-terracotta-dark hover:bg-secondary-terracotta-100" },
];

export default function DishResultCard({
  id,
  nameEn,
  nameMs,
  nameZh,
  allergens,
  riskLevel,
  riskReason,
  savedLabel,
  onSave,
  saving,
}: DishResultCardProps) {
  const risk = RISK_STYLES[riskLevel];

  return (
    <div className="card rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-h3 text-neutral-800">{nameEn}</h3>
          {(nameMs || nameZh) && (
            <p className="text-caption text-neutral-500">
              {[nameMs, nameZh].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <span className={`text-label-sm font-semibold px-2 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>
          {risk.label}
        </span>
      </div>

      {riskReason && riskLevel !== "unknown" && (
        <p className="text-body-sm text-neutral-600 mb-2">{riskReason}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {allergens.map((a) => (
          <span key={a} className="pill bg-neutral-100 text-neutral-700 text-caption">{a}</span>
        ))}
      </div>

      <div className="flex gap-1">
        {SAVE_LABELS.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => onSave(id, btn.value)}
            disabled={saving}
            className={`text-body-sm min-h-[44px] px-3 py-1 rounded-full transition-colors ${
              savedLabel === btn.value
                ? `${btn.className} ring-2 ring-primary-sage`
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            } disabled:opacity-50`}
            aria-label={`Mark ${nameEn} as ${btn.label}`}
            aria-pressed={savedLabel === btn.value}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
