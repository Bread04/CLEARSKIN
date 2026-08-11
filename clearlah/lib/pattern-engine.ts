import type { DbLogEntry } from "@/lib/types/database";

export type Pillar = "food" | "lifestyle" | "skincare" | "symptoms" | "weather";

export interface CorrelationResult {
  trigger: string;
  pillar: Pillar;
  confidence: number;
  cooccurrence_count: number;
  affected_days: string[];
  explanation_template: string;
}

export interface InsufficientDataResult {
  status: "insufficient_data";
  entries_needed: number;
}

const MIN_ENTRIES = 7;
const MAX_RESULTS = 5;
const MIN_CONFIDENCE = 5;
const MIN_SEVERITY_DIFF = 1.0;

function avgSeverity(entries: DbLogEntry[]): number {
  const scores: number[] = [];
  for (const e of entries) {
    const vals = [e.symptoms.skin, e.symptoms.gut, e.symptoms.respiratory].filter((v) => (v ?? 0) > 0);
    if (vals.length > 0) scores.push((vals as number[]).reduce((a, b) => a + b, 0) / vals.length);
  }
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function entryDates(entries: DbLogEntry[]): string[] {
  return entries.map((e) => e.logged_at);
}

export function detectCorrelations(
  entries: DbLogEntry[]
): CorrelationResult[] | InsufficientDataResult {
  if (entries.length < MIN_ENTRIES) {
    return {
      status: "insufficient_data",
      entries_needed: MIN_ENTRIES - entries.length,
    };
  }

  const results: CorrelationResult[] = [];

  // ── Food correlation ──
  const foodCounts = new Map<string, { withFood: DbLogEntry[]; withoutFood: DbLogEntry[] }>();

  for (const entry of entries) {
    const seen = new Set<string>();
    for (const item of entry.food.items) {
      const name = item.name.toLowerCase();
      if (seen.has(name)) continue;
      seen.add(name);

      if (!foodCounts.has(name)) {
        foodCounts.set(name, { withFood: [], withoutFood: [] });
      }
      foodCounts.get(name)!.withFood.push(entry);
    }
  }

  foodCounts.forEach((groups, name) => {
    for (const entry of entries) {
      const hasItem = entry.food.items.some((i) => i.name.toLowerCase() === name);
      if (!hasItem) {
        groups.withoutFood.push(entry);
      }
    }

    if (groups.withFood.length >= 2 && groups.withoutFood.length >= 2) {
      const withAvg = avgSeverity(groups.withFood);
      const withoutAvg = avgSeverity(groups.withoutFood);
      const diff = withAvg - withoutAvg;

      if (diff >= MIN_SEVERITY_DIFF) {
        const confidence = Math.min(Math.round(diff * 15), 95);
        if (confidence >= MIN_CONFIDENCE) {
          results.push({
            trigger: name.charAt(0).toUpperCase() + name.slice(1),
            pillar: "food",
            confidence,
            cooccurrence_count: groups.withFood.length,
            affected_days: entryDates(groups.withFood),
            explanation_template: `{trigger} appeared on {count} of your flare days ({confidence}% confidence).`,
          });
        }
      }
    }
  });

  // ── Weather: humidity buckets ──
  const highHumidity = entries.filter(
    (e) => (e.weather_snapshot?.humidity ?? 0) > 85
  );
  const lowHumidity = entries.filter(
    (e) => (e.weather_snapshot?.humidity ?? 100) <= 85
  );

  if (highHumidity.length >= 2 && lowHumidity.length >= 3) {
    const highAvg = avgSeverity(highHumidity);
    const lowAvg = avgSeverity(lowHumidity);
    const diff = highAvg - lowAvg;

    if (diff >= MIN_SEVERITY_DIFF) {
      const confidence = Math.min(Math.round(diff * 12), 90);
      if (confidence >= MIN_CONFIDENCE) {
        results.push({
          trigger: "Humidity > 85%",
          pillar: "weather",
          confidence,
          cooccurrence_count: highHumidity.length,
          affected_days: entryDates(highHumidity),
          explanation_template:
            "Your skin flares tend to peak when humidity is above 85%. This pattern appeared on {count} of your logged days ({confidence}% confidence).",
        });
      }
    }
  }

  // ── Sleep correlation ──
  const lowSleep = entries.filter(
    (e) => (e.lifestyle.sleep_hours ?? 99) < 6
  );
  const goodSleep = entries.filter(
    (e) => (e.lifestyle.sleep_hours ?? 99) >= 6
  );

  if (lowSleep.length >= 2 && goodSleep.length >= 3) {
    const lowAvg = avgSeverity(lowSleep);
    const goodAvg = avgSeverity(goodSleep);
    const diff = lowAvg - goodAvg;

    if (diff >= MIN_SEVERITY_DIFF) {
      const confidence = Math.min(Math.round(diff * 12), 85);
      if (confidence >= MIN_CONFIDENCE) {
        results.push({
          trigger: "Sleep < 6h",
          pillar: "lifestyle",
          confidence,
          cooccurrence_count: lowSleep.length,
          affected_days: entryDates(lowSleep),
          explanation_template:
            "On days with less than 6 hours of sleep, symptoms averaged {avg} — higher than well-rested days ({confidence}% confidence).",
        });
      }
    }
  }

  // ── Stress correlation ──
  const highStress = entries.filter(
    (e) => (e.lifestyle.stress_level ?? 0) >= 4
  );
  const lowStress = entries.filter(
    (e) => (e.lifestyle.stress_level ?? 0) < 4 && (e.lifestyle.stress_level ?? 0) > 0
  );

  if (highStress.length >= 2 && lowStress.length >= 2) {
    const highAvg = avgSeverity(highStress);
    const lowAvg = avgSeverity(lowStress);
    const diff = highAvg - lowAvg;

    if (diff >= MIN_SEVERITY_DIFF) {
      const confidence = Math.min(Math.round(diff * 12), 85);
      if (confidence >= MIN_CONFIDENCE) {
        results.push({
          trigger: "High Stress (4-5)",
          pillar: "lifestyle",
          confidence,
          cooccurrence_count: highStress.length,
          affected_days: entryDates(highStress),
          explanation_template:
            "High-stress days show higher symptom severity compared to lower-stress days ({confidence}% confidence).",
        });
      }
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);

  return results.slice(0, MAX_RESULTS);
}
