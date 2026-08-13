export interface SafeMeal {
  dish_name: string;
  category: "hawker" | "restaurant" | "international";
  frequency: number;
  last_eaten: string;
  avg_symptom_score: number;
  safe_score: number;
}

export interface SafeMealAnalysis {
  meals: SafeMeal[];
  total_days: number;
  generated_at: string;
}

interface LogEntryInput {
  logged_at: string;
  food: { items?: Array<string | { name: string }>; hawker_dishes?: string[] } | null;
  symptoms: { skin?: number | null; gut?: number | null; respiratory?: number | null } | null;
}

function titleCase(name: string): string {
  return name
    .split(" ")
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isValidNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function analyzeSafeMeals(
  logEntries: LogEntryInput[],
  knownTriggers: string[],
): SafeMealAnalysis {
  const triggerSet = new Set(knownTriggers.map((t) => t.toLowerCase()));
  const mealMap = new Map<string, { dates: string[]; scores: number[] }>();

  for (const entry of logEntries) {
    const skin = isValidNumber(entry.symptoms?.skin) ? (entry.symptoms!.skin as number) : 0;
    const gut = isValidNumber(entry.symptoms?.gut) ? (entry.symptoms!.gut as number) : 0;
    const respiratory = isValidNumber(entry.symptoms?.respiratory) ? (entry.symptoms!.respiratory as number) : 0;
    const maxSymptom = Math.max(skin, gut, respiratory);

    const dishes: string[] = [];
    if (entry.food?.items) {
      for (const item of entry.food.items) {
        if (typeof item === "string") {
          dishes.push(item);
        } else if (item && typeof item.name === "string") {
          dishes.push(item.name);
        }
      }
    }
    if (entry.food?.hawker_dishes) dishes.push(...entry.food.hawker_dishes);

    for (const dish of dishes) {
      const key = dish.toLowerCase().trim();
      if (!key) continue;

      const existing = mealMap.get(key) || { dates: [], scores: [] };
      existing.dates.push(entry.logged_at);
      existing.scores.push(maxSymptom);
      mealMap.set(key, existing);
    }
  }

  const meals: SafeMeal[] = [];

  mealMap.forEach((data, dishName) => {
    if (data.dates.length < 2) return;

    const avgSymptom = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    if (avgSymptom > 3) return;

    if (triggerSet.has(dishName) || knownTriggers.some((t) => dishName.includes(t.toLowerCase()))) {
      return;
    }

    const sortedDates = [...data.dates].sort();
    const frequency = data.dates.length;
    const lastEaten = sortedDates[sortedDates.length - 1];
    const lastEatenTime = new Date(lastEaten).getTime();
    const recencyBonus = isValidNumber(lastEatenTime)
      ? Math.max(0, Math.min(10, 10 - (Date.now() - lastEatenTime) / (86400000 * 7)))
      : 0;

    const baseScore = avgSymptom <= 1 ? 30 : avgSymptom <= 2 ? 20 : 10;
    const safeScore = Math.min(100, Math.max(0, Math.round(baseScore + frequency * 5 + recencyBonus)));

    let category: SafeMeal["category"] = "hawker";
    const lowerName = dishName.toLowerCase();
    if (["pizza", "pasta", "burger", "fries", "nuggets", "whopper", "big mac", "mcrib", "zinger"].some((w) => lowerName.includes(w))) {
      category = "restaurant";
    } else if (["sushi", "ramen", "bibimbap", "pad thai", "pho", "taco", "burrito"].some((w) => lowerName.includes(w))) {
      category = "international";
    }

    meals.push({
      dish_name: titleCase(dishName),
      category,
      frequency,
      last_eaten: lastEaten,
      avg_symptom_score: Math.round(avgSymptom * 10) / 10,
      safe_score: safeScore,
    });
  });

  meals.sort((a, b) => b.safe_score - a.safe_score);

  return {
    meals: meals.slice(0, 20),
    total_days: new Set(logEntries.map((e) => e.logged_at)).size,
    generated_at: new Date().toISOString(),
  };
}
