import type { DbLogEntry } from "@/lib/types/database";

export interface Suggestion {
  name: string;
  dish_id?: string;
  frequency: number;
  dayOfWeek: number;
}

export function getSuggestedDishes(
  logs: DbLogEntry[],
  targetDayOfWeek: number
): Suggestion[] {
  if (logs.length < 3) return [];

  const sameDayLogs = logs.filter(
    (log) => new Date(log.logged_at).getDay() === targetDayOfWeek
  );

  const dishCounts = new Map<string, { count: number; dishId?: string }>();

  for (const log of sameDayLogs) {
    for (const item of log.food.items) {
      const key = item.name.toLowerCase();
      const existing = dishCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        dishCounts.set(key, { count: 1, dishId: item.dish_id });
      }
    }
  }

  const suggestions: Suggestion[] = [];

  dishCounts.forEach(({ count, dishId }, name) => {
    if (count >= 3) {
      suggestions.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        dish_id: dishId,
        frequency: count,
        dayOfWeek: targetDayOfWeek,
      });
    }
  });

  suggestions.sort((a, b) => b.frequency - a.frequency);

  return suggestions.slice(0, 3);
}
