import { describe, it, expect } from "vitest";
import { isHighRiskDay } from "@/lib/utils/trigger-match";

const mockWeather = { temp: 31, humidity: 82, psi: 45, uv: 9, source: "mock" };

describe("isHighRiskDay", () => {
  it("returns false when no triggers", () => {
    const result = isHighRiskDay([], mockWeather);
    expect(result.isHighRisk).toBe(false);
    expect(result.matchedTriggers).toEqual([]);
  });

  it("returns false when only one trigger matches (needs 2+)", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 74 },
      { trigger: "Shellfish", confidence: 50 },
    ];
    const result = isHighRiskDay(triggers, mockWeather);
    expect(result.isHighRisk).toBe(false);
  });

  it("returns true when humidity trigger + sleep/stress trigger match", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Sleep < 6h", confidence: 60 },
    ];
    const highHumidity = { ...mockWeather, humidity: 88 };
    const result = isHighRiskDay(triggers, highHumidity);
    expect(result.isHighRisk).toBe(true);
    expect(result.matchedTriggers.length).toBeGreaterThanOrEqual(2);
  });

  it("returns true with humidity 80% trigger and humidity is 88", () => {
    const triggers = [
      { trigger: "Humidity > 80%", confidence: 70 },
      { trigger: "High Stress (4-5)", confidence: 55 },
    ];
    const highHumidity = { ...mockWeather, humidity: 88 };
    const result = isHighRiskDay(triggers, highHumidity);
    expect(result.isHighRisk).toBe(true);
  });

  it("returns false when humidity is below threshold", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Sleep < 6h", confidence: 60 },
    ];
    const lowHumidity = { ...mockWeather, humidity: 60 };
    const result = isHighRiskDay(triggers, lowHumidity);
    expect(result.isHighRisk).toBe(false);
  });

  it("returns summary string when high risk", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Sleep < 6h", confidence: 60 },
    ];
    const highHumidity = { ...mockWeather, humidity: 88 };
    const result = isHighRiskDay(triggers, highHumidity);
    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe("string");
  });

  it("matches both food and weather triggers with high humidity", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Shellfish", confidence: 70 },
      { trigger: "Sleep < 6h", confidence: 55 },
    ];
    const highHumidity = { ...mockWeather, humidity: 90 };
    const result = isHighRiskDay(triggers, highHumidity);
    expect(result.isHighRisk).toBe(true);
    expect(result.matchedTriggers).toContain("Humidity > 85%");
    expect(result.matchedTriggers).toContain("Sleep < 6h");
  });
});
