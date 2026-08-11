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

  it("returns false when humidity trigger + food-only trigger (needs 2 weather matches)", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Sleep < 6h", confidence: 60 },
    ];
    const highHumidity = { ...mockWeather, humidity: 88 };
    const result = isHighRiskDay(triggers, highHumidity);
    expect(result.isHighRisk).toBe(false);
    expect(result.matchedTriggers.length).toBe(1);
  });

  it("returns true with humidity 80% + temperature trigger when both conditions met", () => {
    const triggers = [
      { trigger: "Humidity > 80%", confidence: 70 },
      { trigger: "Temperature > 32°C", confidence: 55 },
    ];
    const hotHumid = { ...mockWeather, humidity: 88, temp: 33 };
    const result = isHighRiskDay(triggers, hotHumid);
    expect(result.isHighRisk).toBe(true);
  });

  it("returns false when no weather conditions exceed thresholds", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Temperature > 32°C", confidence: 60 },
    ];
    const mild = { ...mockWeather, humidity: 60, temp: 30 };
    const result = isHighRiskDay(triggers, mild);
    expect(result.isHighRisk).toBe(false);
  });

  it("returns summary string when high risk", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Temperature > 32°C", confidence: 60 },
    ];
    const hotHumid = { ...mockWeather, humidity: 88, temp: 33 };
    const result = isHighRiskDay(triggers, hotHumid);
    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe("string");
  });

  it("matches humidity and temperature triggers with high humidity + heat", () => {
    const triggers = [
      { trigger: "Humidity > 85%", confidence: 80 },
      { trigger: "Shellfish", confidence: 70 },
      { trigger: "Temperature > 32°C", confidence: 55 },
    ];
    const hotHumid = { ...mockWeather, humidity: 90, temp: 33 };
    const result = isHighRiskDay(triggers, hotHumid);
    expect(result.isHighRisk).toBe(true);
    expect(result.matchedTriggers).toContain("Humidity > 85%");
    expect(result.matchedTriggers).toContain("Temperature > 32°C");
  });
});
