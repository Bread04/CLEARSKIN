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

export function analyzeSafeMeals(
  logEntries: Array<{
    logged_at: string;
    food: { items?: string[]; hawker_dishes?: string[] } | null;
    symptoms: { skin?: number | null; gut?: number | null; respiratory?: number | null } | null;
  }>,
  knownTriggers: string[],
): SafeMealAnalysis {
  const triggerSet = new Set(knownTriggers.map((t) => t.toLowerCase()));
  const mealMap = new Map<string, { dates: string[]; scores: number[] }>();

  for (const entry of logEntries) {
    const maxSymptom = Math.max(
      entry.symptoms?.skin ?? 0,
      entry.symptoms?.gut ?? 0,
      entry.symptoms?.respiratory ?? 0,
    );

    const dishes: string[] = [];
    if (entry.food?.items) dishes.push(...entry.food.items);
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

  for (const [dishName, data] of mealMap) {
    if (data.dates.length < 2) continue;

    const avgSymptom = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    if (avgSymptom > 3) continue;

    if (triggerSet.has(dishName) || knownTriggers.some((t) => dishName.includes(t.toLowerCase()))) {
      continue;
    }

    const sortedDates = [...data.dates].sort();
    const frequency = data.dates.length;
    const lastEaten = sortedDates[sortedDates.length - 1];
    const recencyBonus = Math.max(0, 10 - (Date.now() - new Date(lastEaten).getTime()) / (86400000 * 7));
    const safeScore = Math.min(100, Math.round((avgSymptom <= 1 ? 30 : avgSymptom <= 2 ? 20 : 10) + frequency * 5 + recencyBonus));

    let category: SafeMeal["category"] = "hawker";
    const lowerName = dishName.toLowerCase();
    if (["pizza", "pasta", "burger", "fries", "nuggets", "whopper", "big mac", "mcrib", "zinger"].some((w) => lowerName.includes(w))) {
      category = "restaurant";
    } else if (["sushi", "ramen", "bibimbap", "pad thai", "pho", "taco", "burrito"].some((w) => lowerName.includes(w))) {
      category = "international";
    }

    meals.push({
      dish_name: data.dates[0] === sortedDates[0] ? dishName : dishName,
      category,
      frequency,
      last_eaten: lastEaten,
      avg_symptom_score: Math.round(avgSymptom * 10) / 10,
      safe_score: safeScore,
    });
  }

  meals.sort((a, b) => b.safe_score - a.safe_score);

  return {
    meals: meals.slice(0, 20),
    total_days: logEntries.length,
    generated_at: new Date().toISOString(),
  };
}
