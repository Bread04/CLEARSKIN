import { describe, it, expect } from "vitest";
import { analyzeSafeMeals } from "@/lib/safe-meal-analyzer";

describe("GET /api/clearcart/grocery-list — integration", () => {
  it("safe meal analyzer filters correctly with realistic data", () => {
    const entries = Array.from({ length: 14 }, (_, i) => ({
      logged_at: `2026-08-${String(i + 1).padStart(2, "0")}`,
      food: { items: i % 3 === 0 ? ["chicken rice", "teh tarik"] : i % 3 === 1 ? ["laksa"] : ["kaya toast", "kopi"] },
      symptoms: { skin: i % 5 === 0 ? 7 : 2, gut: null, respiratory: null },
    }));

    const result = analyzeSafeMeals(entries, ["shellfish"]);

    expect(result).toHaveProperty("meals");
    expect(result).toHaveProperty("total_days");
    expect(result).toHaveProperty("generated_at");
    expect(result.total_days).toBe(14);

    for (const meal of result.meals) {
      expect(meal).toHaveProperty("dish_name");
      expect(meal).toHaveProperty("frequency");
      expect(meal).toHaveProperty("safe_score");
      expect(meal).toHaveProperty("last_eaten");
      expect(meal.frequency).toBeGreaterThanOrEqual(2);
      expect(meal.safe_score).toBeGreaterThan(0);
    }
  });

  it("filters out high-symptom patterns", () => {
    const entries = [
      { logged_at: "2026-08-01", food: { items: ["spicy noodles"] }, symptoms: { skin: 9, gut: null, respiratory: null } },
      { logged_at: "2026-08-02", food: { items: ["spicy noodles"] }, symptoms: { skin: 8, gut: null, respiratory: null } },
    ];

    const result = analyzeSafeMeals(entries, []);
    expect(result.meals.filter((m) => m.dish_name === "spicy noodles")).toHaveLength(0);
  });

  it("excludes trigger-matched foods", () => {
    const entries = [
      { logged_at: "2026-08-01", food: { items: ["laksa"] }, symptoms: { skin: 1, gut: null, respiratory: null } },
      { logged_at: "2026-08-02", food: { items: ["laksa"] }, symptoms: { skin: 2, gut: null, respiratory: null } },
    ];

    const result = analyzeSafeMeals(entries, ["shellfish", "prawns", "laksa"]);
    expect(result.meals.filter((m) => m.dish_name === "laksa")).toHaveLength(0);
  });
});
