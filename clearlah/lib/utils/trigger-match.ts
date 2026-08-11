interface TriggerEntry {
  factor?: string;
  trigger?: string;
  correlation?: number;
  confidence?: number;
  occurrences?: number;
  condition?: string;
}

interface WeatherSnapshot {
  temp: number;
  humidity: number;
  psi: number;
  uv: number;
  source: string;
}

interface MatchResult {
  isHighRisk: boolean;
  matchedTriggers: string[];
  summary: string;
}

export function isHighRiskDay(
  triggers: TriggerEntry[],
  weather: WeatherSnapshot
): MatchResult {
  if (!triggers || triggers.length === 0) {
    return { isHighRisk: false, matchedTriggers: [], summary: "" };
  }

  const matched: string[] = [];
  const topTriggers = triggers.slice(0, 5);

  for (const trigger of topTriggers) {
    const label = (trigger.trigger ?? trigger.factor ?? "");
    if (!label) continue;
    const factor = label.toLowerCase();

    if (factor.includes("humidity")) {
      const threshold = factor.includes("85") ? 85 : factor.includes("80") ? 80 : 0;
      if (threshold > 0 && weather.humidity > threshold) {
        matched.push(label);
      }
    } else if (factor.includes("temp") || factor.includes("temperature")) {
      if (weather.temp > 32) {
        matched.push(label);
      }
    } else if (factor.includes("psi")) {
      if (weather.psi > 100) {
        matched.push(label);
      }
    }
  }

  const isHighRisk = matched.length >= 2;

  return {
    isHighRisk,
    matchedTriggers: matched,
    summary: isHighRisk ? matched.slice(0, 2).join(", ") : "",
  };
}
