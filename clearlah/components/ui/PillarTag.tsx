"use client";

import type { ReactNode } from "react";

export type Pillar = "food" | "lifestyle" | "skincare" | "symptoms" | "weather";

const VARIANT_CLASSES: Record<Pillar, string> = {
  food: "bg-[#F2EDD9] text-[#7A5C1E]",
  lifestyle: "bg-[#DCE5F0] text-[#2D4E7A]",
  skincare: "bg-[#EDE5F0] text-[#5E3A7A]",
  symptoms: "bg-[#F0E5E5] text-[#7A2D2D]",
  weather: "bg-[#DCF0F0] text-[#1E6060]",
};

interface PillarTagProps {
  pillar: Pillar;
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export default function PillarTag({
  pillar,
  label,
  selected = false,
  onClick,
  className = "",
  children,
}: PillarTagProps) {
  const isInteractive = !!onClick;
  const variant = VARIANT_CLASSES[pillar];

  return (
    <button
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      role={isInteractive ? "checkbox" : "status"}
      aria-checked={isInteractive ? selected : undefined}
      disabled={!isInteractive}
      className={`inline-flex items-center gap-1.5 rounded-sm font-semibold text-caption px-2 py-0.5 transition-all duration-ui min-h-[44px] ${variant} ${
        isInteractive
          ? `cursor-pointer hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary-sage focus-visible:ring-offset-1 ${
              selected ? "ring-2 ring-primary-sage ring-offset-1" : ""
            }`
          : ""
      } ${className}`}
    >
      {selected && (
        <svg
          className="w-3 h-3 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {label}
      {children}
    </button>
  );
}
