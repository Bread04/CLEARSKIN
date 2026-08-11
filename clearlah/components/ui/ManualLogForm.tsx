"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ParsedLog } from "@/lib/types/database";
import type { Suggestion } from "@/lib/utils/suggestions";
import type { Condition } from "@/lib/types/database";
import { getSymptomPillarLabel } from "@/lib/utils/pillars";
import SmartSuggestions from "@/components/ui/SmartSuggestions";
import PillarTag from "@/components/ui/PillarTag";

interface ManualLogFormProps {
  initial: ParsedLog;
  conditions: string[];
  suggestions?: Suggestion[];
  onConfirm: (data: ParsedLog) => void;
  onCancel?: () => void;
}

const STRESS_LABELS = ["Low", "Mild", "Moderate", "High", "Very High"];
const STRESS_TYPES = ["work", "relationship", "physical", "financial", "other"] as const;
const SKINCARE_SUGGESTIONS = [
  "CeraVe", "Cetaphil", "La Roche-Posay", "Aveeno", "Eucerin", "QV", "SebaMed",
  "Innisfree Aloe", "Bioderma", "Neutrogena", "Simple", "Hada Labo",
];

export default function ManualLogForm({
  initial,
  conditions,
  suggestions,
  onConfirm,
  onCancel,
}: ManualLogFormProps) {
  const [foodItems, setFoodItems] = useState<string[]>(initial.food.items);
  const [newFood, setNewFood] = useState("");
  const [sleepHours, setSleepHours] = useState<number | null>(initial.lifestyle.sleep_hours);
  const [stressLevel, setStressLevel] = useState<number | null>(initial.lifestyle.stress_level);
  const [stressType, setStressType] = useState<string | null>(initial.lifestyle.stress_type);
  const [exerciseMinutes, setExerciseMinutes] = useState<number | null>(initial.lifestyle.exercise_minutes ?? null);
  const [waterMl, setWaterMl] = useState<number | null>(initial.lifestyle.water_ml ?? null);
  const [caffeineCups, setCaffeineCups] = useState<number | null>(initial.lifestyle.caffeine_cups ?? null);
  const [alcoholDrinks, setAlcoholDrinks] = useState<number | null>(initial.lifestyle.alcohol_drinks ?? null);
  const [skincare, setSkincare] = useState<string>(initial.skincare || "");
  const [skinSeverity, setSkinSeverity] = useState<number>(initial.symptoms.skin ?? 0);
  const [gutSeverity, setGutSeverity] = useState<number>(initial.symptoms.gut ?? 0);
  const [respiratorySeverity, setRespiratorySeverity] = useState<number>(initial.symptoms.respiratory ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [hawkerQuery, setHawkerQuery] = useState("");
  const [hawkerResults, setHawkerResults] = useState<Array<{ id: string; name_en: string; name_ms?: string; name_zh?: string }>>([]);
  const [showHawkerResults, setShowHawkerResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchHawker = useCallback((q: string) => {
    const query = q.trim();
    if (!query) {
      fetch("/api/hawker")
        .then((r) => r.json())
        .then((data) => { setHawkerResults(data.results ?? []); })
        .catch(() => {});
      return;
    }
    fetch(`/api/hawker?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => { setHawkerResults(data.results ?? []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchHawker(hawkerQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [hawkerQuery, searchHawker]);

  const symptomLabel = getSymptomPillarLabel(conditions as Condition[]);

  const addFood = useCallback(() => {
    const item = newFood.trim();
    if (item && !foodItems.includes(item)) {
      setFoodItems((prev) => [...prev, item]);
    }
    setNewFood("");
  }, [newFood, foodItems]);

  const removeFood = useCallback((item: string) => {
    setFoodItems((prev) => prev.filter((f) => f !== item));
  }, []);

  const handleConfirm = useCallback(() => {
    const hasFood = foodItems.length > 0;
    const hasSleep = sleepHours !== null;
    const hasStress = stressLevel !== null;
    const hasSkincare = skincare.trim().length > 0;
    const hasSymptoms = skinSeverity > 0 || gutSeverity > 0 || respiratorySeverity > 0;

    if (!hasFood && !hasSleep && !hasStress && !hasSkincare && !hasSymptoms) {
      setError("Add at least one thing to log — a meal, how you slept, or how you're feeling.");
      return;
    }

    if (sleepHours !== null && (sleepHours < 0 || sleepHours > 24)) {
      setError("Sleep hours must be between 0 and 24.");
      return;
    }

    setError(null);
    onConfirm({
      food: { items: foodItems, hawker_dishes: initial.food.hawker_dishes },
      lifestyle: {
        sleep_hours: sleepHours,
        stress_level: stressLevel,
        stress_type: stressType,
        exercise_minutes: exerciseMinutes,
        water_ml: waterMl,
        caffeine_cups: caffeineCups,
        alcohol_drinks: alcoholDrinks,
      },
      skincare: skincare.trim() || null,
      symptoms: {
        skin: skinSeverity || null,
        gut: gutSeverity || null,
        respiratory: respiratorySeverity || null,
      },
      summary: initial.summary,
    });
  }, [foodItems, sleepHours, stressLevel, stressType, exerciseMinutes, waterMl, caffeineCups, alcoholDrinks, skincare, skinSeverity, gutSeverity, respiratorySeverity, initial, onConfirm]);

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border-l-4 border-status-error bg-status-error-bg px-4 py-3 text-body-sm text-neutral-800">
          {error}
        </div>
      )}

      <section>
        <h3 className="text-h3 text-neutral-800 mb-3">Food</h3>
        {suggestions && suggestions.length > 0 && (
          <div className="mb-3">
            <SmartSuggestions
              suggestions={suggestions}
              onSelect={(s) => {
                if (!foodItems.includes(s.name)) {
                  setFoodItems((prev) => [...prev, s.name]);
                }
              }}
            />
          </div>
        )}

        <div className="relative mb-3">
          <input
            type="text"
            value={hawkerQuery}
            onChange={(e) => { setHawkerQuery(e.target.value); setShowHawkerResults(true); }}
            onFocus={() => { setShowHawkerResults(true); if (!hawkerQuery) searchHawker(""); }}
            onBlur={() => setTimeout(() => setShowHawkerResults(false), 200)}
            placeholder="Search hawker dishes..."
            className="input"
            aria-label="Search hawker dishes"
          />
          {showHawkerResults && hawkerResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-neutral-200 shadow-lg max-h-48 overflow-y-auto">
              {hawkerResults.map((dish) => (
                <button
                  key={dish.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const name = dish.name_en;
                    if (!foodItems.includes(name)) {
                      setFoodItems((prev) => [...prev, name]);
                    }
                    setHawkerQuery("");
                    setShowHawkerResults(false);
                  }}
                  className="w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50 transition-colors duration-ui border-b border-neutral-100 last:border-b-0"
                  aria-label={`Add ${dish.name_en}`}
                >
                  <span className="font-medium text-neutral-800">{dish.name_en}</span>
                  {dish.name_ms && <span className="text-neutral-400 ml-1">/ {dish.name_ms}</span>}
                  {dish.name_zh && <span className="text-neutral-400 ml-1">/ {dish.name_zh}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {foodItems.map((item) => (
            <span key={item} className="pill-sage inline-flex items-center gap-1">
              {item}
              <button
                type="button"
                onClick={() => removeFood(item)}
                aria-label={`Remove ${item}`}
                className="ml-1 text-primary-sage-dark hover:text-neutral-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFood(); } }}
            placeholder="Add food or drink..."
            className="input flex-1"
            aria-label="Add food item"
          />
          <button
            type="button"
            onClick={addFood}
            className="btn-secondary text-body-sm min-h-[44px] px-3"
            aria-label="Add food"
          >
            Add
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-h3 text-neutral-800 mb-3">Sleep</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSleepHours((prev) => (prev ?? 0) > 0 ? prev! - 0.5 : 0)}
            className="btn-secondary min-h-[44px] min-w-[44px] text-lg"
            aria-label="Decrease sleep"
          >
            −
          </button>
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={sleepHours ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : parseFloat(e.target.value);
              setSleepHours(v);
            }}
            placeholder="Hours"
            className="input w-24 text-center"
            aria-label="Sleep hours"
          />
          <button
            type="button"
            onClick={() => setSleepHours((prev) => Math.min((prev ?? 0) + 0.5, 24))}
            className="btn-secondary min-h-[44px] min-w-[44px] text-lg"
            aria-label="Increase sleep"
          >
            +
          </button>
          <span className="text-body-sm text-neutral-500 ml-2">hours</span>
        </div>
      </section>

      <section>
        <h3 className="text-h3 text-neutral-800 mb-3">Stress</h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {STRESS_LABELS.map((label, i) => {
            const level = i + 1;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setStressLevel(level === stressLevel ? null : level)}
                className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-full text-body-sm font-medium transition-colors duration-ui ${
                  stressLevel === level
                    ? "bg-primary-sage text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
                aria-label={`Stress level ${level}: ${label}`}
                aria-pressed={stressLevel === level}
              >
                {label}
              </button>
            );
          })}
        </div>
        {stressLevel !== null && (
          <div className="flex flex-wrap gap-1">
            {STRESS_TYPES.map((type) => (
              <PillarTag
                key={type}
                pillar="lifestyle"
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                selected={stressType === type}
                onClick={() => setStressType(type === stressType ? null : type)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-h3 text-neutral-800 mb-3">Skincare</h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {SKINCARE_SUGGESTIONS.map((product) => (
            <button
              key={product}
              type="button"
              onClick={() =>
                setSkincare((prev) =>
                  prev ? `${prev}, ${product}` : product
                )
              }
              className="pill bg-neutral-100 text-neutral-700 hover:bg-neutral-200 min-h-[44px] text-body-sm"
              aria-label={`Add ${product}`}
            >
              {product}
            </button>
          ))}
        </div>
        <textarea
          value={skincare}
          onChange={(e) => setSkincare(e.target.value)}
          placeholder="e.g. Cetaphil, CeraVe"
          rows={2}
          className="input resize-none"
          aria-label="Skincare products"
        />
      </section>

      <section>
        <h3 className="text-h3 text-neutral-800 mb-3">Daily Habits</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-body-sm text-neutral-600 block mb-1">Exercise (min)</label>
            <input
              type="number" min={0} max={300}
              value={exerciseMinutes ?? ""}
              onChange={(e) => setExerciseMinutes(e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="e.g. 30" className="input" aria-label="Exercise minutes"
            />
          </div>
          <div>
            <label className="text-body-sm text-neutral-600 block mb-1">Water (ml)</label>
            <input
              type="number" min={0} max={5000} step={100}
              value={waterMl ?? ""}
              onChange={(e) => setWaterMl(e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="e.g. 2000" className="input" aria-label="Water intake in ml"
            />
          </div>
          <div>
            <label className="text-body-sm text-neutral-600 block mb-1">Caffeine (cups)</label>
            <input
              type="number" min={0} max={20}
              value={caffeineCups ?? ""}
              onChange={(e) => setCaffeineCups(e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="e.g. 2" className="input" aria-label="Caffeine cups"
            />
          </div>
          <div>
            <label className="text-body-sm text-neutral-600 block mb-1">Alcohol (drinks)</label>
            <input
              type="number" min={0} max={20}
              value={alcoholDrinks ?? ""}
              onChange={(e) => setAlcoholDrinks(e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="e.g. 0" className="input" aria-label="Alcohol drinks"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-h3 text-neutral-800 mb-3">{symptomLabel}</h3>
        {([
          { key: "skin" as const, label: symptomLabel, value: skinSeverity, setter: setSkinSeverity },
          { key: "gut" as const, label: "Gut", value: gutSeverity, setter: setGutSeverity },
          { key: "respiratory" as const, label: "Respiratory", value: respiratorySeverity, setter: setRespiratorySeverity },
        ]).map(({ key, label, value, setter }) => (
          <div key={key} className="flex items-center gap-3 mb-2">
            <span className="text-body-sm text-neutral-700 w-24 flex-shrink-0">{label}</span>
            <input
              type="range"
              min={0}
              max={10}
              value={value}
              onChange={(e) => setter(parseInt(e.target.value, 10))}
              className="flex-1 accent-primary-sage"
              aria-label={`${label} severity`}
            />
            <span className="text-body-sm font-semibold text-neutral-800 w-6 text-right">
              {value || 0}
            </span>
          </div>
        ))}
      </section>

      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-body-md min-h-[44px] px-6 rounded-full"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          className="btn-primary text-body-md flex-1 min-h-[44px] py-3 rounded-full"
        >
          Confirm &amp; Save
        </button>
      </div>
    </div>
  );
}
