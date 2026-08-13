import { describe, it, expect } from "vitest";
import { analyzeSafeMeals, type SafeMeal } from "@/lib/safe-meal-analyzer";

const makeEntry = (
  date: string,
  items: string[],
  hawkerDishes: string[],
  skin: number | null,
  gut: number | null,
  respiratory: number | null,
) => ({
  logged_at: date,
  food: { items, hawker_dishes: hawkerDishes },
  symptoms: { skin, gut, respiratory },
});

describe("analyzeSafeMeals", () => {
  it("returns empty array when fewer than 2 occurrences of any dish", () => {
    const entries = [
      makeEntry("2026-08-01", ["chicken rice"], [], 2, null, null),
      makeEntry("2026-08-02", ["laksa"], [], 1, null, null),
    ];
    const result = analyzeSafeMeals(entries, []);
    expect(result.meals).toHaveLength(0);
  });

  it("identifies safe meals with low symptom scores and multiple occurrences", () => {
    const entries = [
      makeEntry("2026-08-01", ["chicken rice"], [], 2, null, null),
      makeEntry("2026-08-02", ["chicken rice"], [], 1, null, null),
      makeEntry("2026-08-03", ["chicken rice"], [], 3, null, null),
    ];
    const result = analyzeSafeMeals(entries, []);
    expect(result.meals).toHaveLength(1);
    expect(result.meals[0].dish_name.toLowerCase()).toContain("chicken rice");
    expect(result.meals[0].frequency).toBe(3);
    expect(result.meals[0].safe_score).toBeGreaterThan(0);
  });

  it("excludes dishes with avg symptom score > 3", () => {
    const entries = [
      makeEntry("2026-08-01", ["laksa"], [], 7, null, null),
      makeEntry("2026-08-02", ["laksa"], [], 8, null, null),
    ];
    const result = analyzeSafeMeals(entries, []);
    expect(result.meals).toHaveLength(0);
  });

  it("excludes known trigger foods", () => {
    const entries = [
      makeEntry("2026-08-01", ["prawns"], [], 1, null, null),
      makeEntry("2026-08-02", ["prawns"], [], 2, null, null),
    ];
    const result = analyzeSafeMeals(entries, ["prawns", "shellfish"]);
    expect(result.meals).toHaveLength(0);
  });

  it("uses max symptom across skin/gut/respiratory", () => {
    const entries = [
      makeEntry("2026-08-01", ["nasi lemak"], [], 0, null, 8),
      makeEntry("2026-08-02", ["nasi lemak"], [], 0, null, 7),
    ];
    const result = analyzeSafeMeals(entries, []);
    expect(result.meals).toHaveLength(0);
  });

  it("sorts meals by safe_score descending", () => {
    const entries = [
      makeEntry("2026-08-01", ["chicken rice"], [], 1, null, null),
      makeEntry("2026-08-02", ["chicken rice"], [], 0, null, null),
      makeEntry("2026-08-03", ["kaya toast"], [], 2, null, null),
      makeEntry("2026-08-04", ["kaya toast"], [], 1, null, null),
    ];
    const result = analyzeSafeMeals(entries, []);
    expect(result.meals.length).toBeGreaterThanOrEqual(2);
    expect(result.meals[0].safe_score).toBeGreaterThanOrEqual(result.meals[1].safe_score);
  });

  it("limits results to top 20", () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      makeEntry(`2026-08-${String(i + 1).padStart(2, "0")}`, [`dish${i}`], [], 1, null, null),
    );
    for (let i = 0; i < 30; i++) {
      entries.push(makeEntry(`2026-08-${String(i + 1).padStart(2, "0")}`, [`dish${i}`], [], 2, null, null));
    }
    const result = analyzeSafeMeals(entries, []);
    expect(result.meals.length).toBeLessThanOrEqual(20);
  });
});
