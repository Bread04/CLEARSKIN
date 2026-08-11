"use client";

import { useState, useEffect, useCallback } from "react";
import DishResultCard from "@/components/hawker/DishResultCard";
import FoodGuide from "@/components/hawker/FoodGuide";

interface DishResult {
  id: string;
  name_en: string;
  name_ms: string | null;
  name_zh: string | null;
  allergens: string[];
  category: string;
  food_type: string;
}

interface SavedDishRow {
  dish_id: string;
  safety_label: string;
}

type RiskLevel = "high" | "moderate" | "safe" | "unknown";

export default function HawkerPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DishResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [knownAllergens, setKnownAllergens] = useState<string[]>([]);
  const [triggerCache, setTriggerCache] = useState<Record<string, unknown> | null>(null);
  const [savedDishes, setSavedDishes] = useState<Array<SavedDishRow & { name_en?: string; saved_at?: string }>>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        if (d.profile?.known_allergens) setKnownAllergens(d.profile.known_allergens);
        if (d.profile?.trigger_cache) setTriggerCache(d.profile.trigger_cache);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/hawker/save")
      .then((r) => r.json())
      .then((d) => {
        if (d.dishes) setSavedDishes(d.dishes);
      })
      .catch(() => {});
  }, []);

  const fetchSavedDishes = () => {
    fetch("/api/hawker/save")
      .then((r) => r.json())
      .then((d) => {
        if (d.dishes) setSavedDishes(d.dishes);
      })
      .catch(() => {});
  };

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/hawker?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const computeRisk = (dish: DishResult): { level: RiskLevel; reason: string } => {
    const topTriggers = ((triggerCache as Record<string, unknown>)?.top_triggers as Array<Record<string, unknown>>) ?? [];
    const triggerTriggers: string[] = topTriggers
      .filter((t) => {
        const raw = (t.confidence ?? t.correlation ?? 0) as number;
        const c = raw <= 1 ? raw * 100 : raw;
        return c >= 50;
      })
      .map((t) => String(t.trigger ?? t.factor ?? "")).filter(Boolean)
      .map((s) => s.toLowerCase());

    const highOverlap = dish.allergens.filter((a) =>
      knownAllergens.some((ka) => ka.toLowerCase() === a.toLowerCase())
    );
    const triggerOverlap = dish.allergens.filter((a) =>
      triggerTriggers.some((t) => t.includes(a.toLowerCase()) || a.toLowerCase().includes(t))
    );

    if (highOverlap.length > 0 || triggerOverlap.length > 0) {
      const sources = Array.from(new Set([...highOverlap, ...triggerOverlap]));
      return { level: "high", reason: `Contains ${sources.join(", ")} — your known trigger` };
    }
    if (dish.allergens.length > 0) {
      return { level: "moderate", reason: "Contains potential allergens" };
    }
    return { level: "safe", reason: "No known allergen overlap" };
  };

  const handleSave = async (dishId: string, label: string) => {
    setSaving(dishId);
    try {
      const res = await fetch("/api/hawker/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish_id: dishId, safety_label: label }),
      });
      if (res.ok) {
        setSavedDishes((prev) => {
          const filtered = prev.filter((d) => d.dish_id !== dishId);
          const dish = results.find((r) => r.id === dishId);
          return [...filtered, { dish_id: dishId, safety_label: label, name_en: dish?.name_en, saved_at: new Date().toISOString() }];
        });
      }
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (dishId: string) => {
    setSavedDishes((prev) => prev.filter((d) => d.dish_id !== dishId));
    try {
      await fetch("/api/hawker/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish_id: dishId }),
      });
    } catch {
      // re-add on failure
    }
  };

  const getSavedLabel = (dishId: string) =>
    savedDishes.find((d) => d.dish_id === dishId)?.safety_label ?? null;

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-h2 text-neutral-900">Hawker Guide</h1>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes in English, Malay, or Chinese..."
          className="input"
          autoFocus
          aria-label="Search hawker dishes"
        />

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card rounded-xl p-4 skeleton h-28" />
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((dish) => {
              const risk = computeRisk(dish);
              return (
                <DishResultCard
                  key={dish.id}
                  id={dish.id}
                  nameEn={dish.name_en}
                  nameMs={dish.name_ms}
                  nameZh={dish.name_zh}
                  allergens={dish.allergens}
                  foodType={dish.food_type}
                  riskLevel={risk.level}
                  riskReason={risk.reason}
                  savedLabel={getSavedLabel(dish.id)}
                  onSave={handleSave}
                  saving={saving === dish.id}
                />
              );
            })}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="card rounded-xl p-6 text-center">
            <p className="text-body-md text-neutral-500">
              No dishes found for &apos;{query}&apos;. Try the English, Malay, or Chinese name.
            </p>
          </div>
        )}

        <FoodGuide
          dishes={savedDishes.map((d) => ({
            dish_id: d.dish_id,
            dish_name: d.name_en ?? d.dish_id,
            safety_label: d.safety_label,
            saved_at: d.saved_at ?? "",
          }))}
          onRemove={handleRemove}
        />
      </div>
    </main>
  );
}
