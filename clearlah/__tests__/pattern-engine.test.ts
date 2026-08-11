import { describe, it, expect } from "vitest";
import { detectCorrelations } from "@/lib/pattern-engine";
import type { DbLogEntry } from "@/lib/types/database";

function makeEntry(
  date: string,
  foods: string[],
  sleep: number,
  stress: number,
  skin: number,
  gut: number,
  respiratory: number,
  humidity: number
): DbLogEntry {
  return {
    id: `id-${date}`,
    user_id: "test-user",
    logged_at: date,
    food: { items: foods.map((name) => ({ name })) },
    lifestyle: { sleep_hours: sleep, stress_level: stress, stress_type: null, exercise_minutes: null, water_ml: null, caffeine_cups: null, alcohol_drinks: null },
    skincare: null,
    symptoms: { skin, gut, respiratory },
    weather_snapshot: { temp: 30, humidity, psi: 50, uv: 7, source: "mock" as const, simulated_fields: [], fetched_at: date },
    created_at: date,
  };
}

describe("detectCorrelations", () => {
  it("returns insufficient_data for less than 7 entries", () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry(`2026-08-0${i + 1}`, ["chicken rice"], 7, 3, 5, 0, 0, 70)
    );
    const result = detectCorrelations(entries);
    expect("status" in result).toBe(true);
    if ("status" in result) {
      expect(result.status).toBe("insufficient_data");
      expect(result.entries_needed).toBe(2);
    }
  });

  it("returns correlations for 7+ entries", () => {
    const entries = Array.from({ length: 7 }, (_, i) =>
      makeEntry(`2026-08-0${i + 1}`, ["chicken rice"], 7, 3, 3, 0, 0, 70)
    );
    const result = detectCorrelations(entries);
    expect(Array.isArray(result)).toBe(true);
  });

  it("detects food correlation with high severity on food days", () => {
    const entries = [
      makeEntry("2026-08-01", ["shellfish"], 7, 3, 8, 3, 0, 70),
      makeEntry("2026-08-02", ["shellfish"], 7, 3, 9, 2, 0, 70),
      makeEntry("2026-08-03", ["shellfish"], 7, 3, 8, 4, 0, 70),
      makeEntry("2026-08-04", ["salad"], 7, 3, 2, 0, 0, 70),
      makeEntry("2026-08-05", ["salad"], 7, 3, 1, 0, 0, 70),
      makeEntry("2026-08-06", ["salad"], 7, 3, 2, 0, 0, 70),
      makeEntry("2026-08-07", ["rice"], 7, 3, 3, 0, 0, 70),
    ];
    const result = detectCorrelations(entries);
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      const shellfish = result.find((c) => c.trigger.toLowerCase() === "shellfish");
      expect(shellfish).toBeDefined();
      if (shellfish) {
        expect(shellfish.pillar).toBe("food");
        expect(shellfish.confidence).toBeGreaterThan(40);
        expect(shellfish.cooccurrence_count).toBe(3);
      }
    }
  });

  it("detects humidity correlation", () => {
    const entries = [
      makeEntry("2026-08-01", ["rice"], 7, 3, 8, 3, 2, 95),
      makeEntry("2026-08-02", ["rice"], 7, 3, 9, 2, 0, 90),
      makeEntry("2026-08-03", ["rice"], 7, 3, 7, 4, 1, 88),
      makeEntry("2026-08-04", ["rice"], 7, 3, 2, 0, 0, 60),
      makeEntry("2026-08-05", ["rice"], 7, 3, 1, 0, 0, 55),
      makeEntry("2026-08-06", ["rice"], 7, 3, 2, 1, 0, 65),
      makeEntry("2026-08-07", ["rice"], 7, 3, 3, 0, 0, 50),
    ];
    const result = detectCorrelations(entries);
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      const humidity = result.find((c) => c.trigger === "Humidity > 85%");
      expect(humidity).toBeDefined();
    }
  });

  it("tops out at 5 results", () => {
    const entries = Array.from({ length: 14 }, (_, i) =>
      makeEntry(
        `2026-08-${String(i + 1).padStart(2, "0")}`,
        [`food-${i}`],
        7,
        3,
        5 + (i % 5),
        3,
        i % 3,
        70 + (i % 40)
      )
    );
    const result = detectCorrelations(entries);
    if (Array.isArray(result)) {
      expect(result.length).toBeLessThanOrEqual(5);
    }
  });

  it("sorts by confidence descending", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(
        `2026-08-${String(i + 1).padStart(2, "0")}`,
        [`item-a`, `item-b`],
        7,
        3,
        i >= 5 ? 8 : 2,
        i >= 5 ? 5 : 1,
        0,
        70
      )
    );
    const result = detectCorrelations(entries);
    if (Array.isArray(result) && result.length >= 2) {
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
      }
    }
  });

  it("includes affected_days with correct dates", () => {
    const entries = [
      makeEntry("2026-08-01", ["shellfish"], 7, 3, 8, 0, 0, 70),
      makeEntry("2026-08-02", ["shellfish"], 7, 3, 7, 0, 0, 70),
      makeEntry("2026-08-03", ["shellfish"], 7, 3, 9, 0, 0, 70),
      makeEntry("2026-08-04", ["salad"], 7, 3, 2, 0, 0, 70),
      makeEntry("2026-08-05", ["salad"], 7, 3, 1, 0, 0, 70),
      makeEntry("2026-08-06", ["salad"], 7, 3, 2, 0, 0, 70),
      makeEntry("2026-08-07", ["rice"], 7, 3, 3, 0, 0, 70),
    ];
    const result = detectCorrelations(entries);
    if (Array.isArray(result)) {
      const shellfish = result.find((c) => c.trigger.toLowerCase() === "shellfish");
      expect(shellfish?.affected_days).toHaveLength(3);
      expect(shellfish?.affected_days).toContain("2026-08-01");
    }
  });
});
