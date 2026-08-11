import { describe, it, expect } from "vitest";
import { getSuggestedDishes, type Suggestion } from "@/lib/utils/suggestions";
import type { DbLogEntry } from "@/lib/types/database";

function makeLog(date: string, ...foods: string[]): DbLogEntry {
  return {
    id: `id-${date}`,
    user_id: "test-user",
    logged_at: date,
    food: { items: foods.map((name) => ({ name })) },
    lifestyle: { sleep_hours: 7, stress_level: 3, stress_type: null },
    skincare: null,
    symptoms: { skin: null, gut: null, respiratory: null },
    weather_snapshot: null,
    created_at: date,
  };
}

describe("getSuggestedDishes", () => {
  it("returns empty for less than 3 logs", () => {
    const logs = [makeLog("2026-08-01", "chicken rice")];
    expect(getSuggestedDishes(logs, 1)).toEqual([]);
  });

  it("returns suggestions for dishes appearing 3+ times on same day-of-week", () => {
    const logs = [
      makeLog("2026-08-03", "chicken rice"),  // Monday
      makeLog("2026-08-10", "chicken rice", "laksa"),  // Monday
      makeLog("2026-08-17", "chicken rice"),  // Monday
    ];
    const result = getSuggestedDishes(logs, 1); // Monday
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Chicken rice");
    expect(result[0].frequency).toBe(3);
  });

  it("maxes at 3 suggestions sorted by frequency", () => {
    const logs = [
      makeLog("2026-08-03", "a", "b", "c", "d"),
      makeLog("2026-08-10", "a", "b", "c", "d"),
      makeLog("2026-08-17", "a", "b", "c", "d"),
    ];
    const result = getSuggestedDishes(logs, 1); // Monday
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0].name).toBe("A");
  });

  it("filters to same day-of-week only", () => {
    const logs = [
      makeLog("2026-08-03", "chicken rice"),  // Monday
      makeLog("2026-08-05", "chicken rice"),  // Wednesday
      makeLog("2026-08-07", "chicken rice"),  // Friday
      makeLog("2026-08-10", "chicken rice"),  // Monday
    ];
    // Only 2 Mondays — not enough
    expect(getSuggestedDishes(logs, 1)).toEqual([]);
  });
});
