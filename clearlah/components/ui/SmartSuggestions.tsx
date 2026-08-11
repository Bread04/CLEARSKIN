"use client";

import type { Suggestion } from "@/lib/utils/suggestions";

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
}

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

export default function SmartSuggestions({
  suggestions,
  onSelect,
}: SmartSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const dayName = DAY_NAMES[suggestions[0].dayOfWeek] || "day";

  return (
    <div className="motion-safe:animate-fade-in-up">
      <p className="text-caption text-neutral-500 mb-2">
        Based on your past {dayName}s
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => onSelect(s)}
            className="pill-sage inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity min-h-[44px]"
            aria-label={`Add ${s.name} from past logs`}
          >
            <span aria-hidden="true">🔥</span>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
