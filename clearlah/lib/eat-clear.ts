/**
 * EatClear — "foods to eat" guidance.
 *
 * Wellness-grade, evidence-tiered nutrition recommendations that complement
 * ClearLah's "foods to avoid" trigger detection. Every entry lists the common
 * allergen categories it may contain so we can personalise against a user's
 * known allergens/triggers. This is dietary guidance, not medical advice.
 */

export type EvidenceTier = "strong" | "moderate" | "emerging" | "traditional";

export interface EatClearFood {
  id: string;
  nutrient: string;
  benefit: string;
  evidence: EvidenceTier;
  examples: string[];
  /** Common allergen categories these foods may contain (lowercase). */
  allergens: string[];
}

export const EVIDENCE_LABELS: Record<EvidenceTier, string> = {
  strong: "Strongly supported",
  moderate: "Moderately supported",
  emerging: "Emerging evidence",
  traditional: "Traditional guidance",
};

const SKIN_FOODS: EatClearFood[] = [
  {
    id: "omega-3",
    nutrient: "Omega-3 fatty acids",
    benefit: "Help calm the inflammation that drives flare-ups.",
    evidence: "moderate",
    examples: ["Salmon", "Sardines", "Mackerel", "Chia seeds", "Flaxseed"],
    allergens: ["fish"],
  },
  {
    id: "probiotics",
    nutrient: "Probiotic foods",
    benefit: "Support the gut-skin axis linked to healthier skin.",
    evidence: "emerging",
    examples: ["Plain yogurt", "Kefir", "Kimchi", "Miso", "Kombucha"],
    allergens: ["dairy"],
  },
  {
    id: "vitamin-d",
    nutrient: "Vitamin D",
    benefit: "Plays a role in immune regulation and skin barrier health.",
    evidence: "moderate",
    examples: ["Salmon", "Egg yolk", "Fortified milk", "Mushrooms"],
    allergens: ["fish", "egg", "dairy"],
  },
  {
    id: "vitamin-c",
    nutrient: "Vitamin C",
    benefit: "Antioxidant that supports skin barrier repair.",
    evidence: "emerging",
    examples: ["Guava", "Kiwi", "Oranges", "Bell peppers", "Broccoli"],
    allergens: [],
  },
  {
    id: "zinc",
    nutrient: "Zinc",
    benefit: "Supports skin healing and repair.",
    evidence: "moderate",
    examples: ["Oysters", "Pumpkin seeds", "Chickpeas", "Lentils", "Cashews"],
    allergens: ["shellfish", "nuts"],
  },
  {
    id: "antioxidants",
    nutrient: "Antioxidant-rich foods",
    benefit: "Counter oxidative stress that can aggravate inflamed skin.",
    evidence: "emerging",
    examples: ["Blueberries", "Green tea", "Pomegranate", "Dark leafy greens"],
    allergens: [],
  },
  {
    id: "low-glycemic",
    nutrient: "Low-glycemic whole grains",
    benefit: "Steadier blood sugar helps reduce inflammatory spikes.",
    evidence: "emerging",
    examples: ["Oats", "Brown rice", "Quinoa", "Barley"],
    allergens: ["gluten"],
  },
  {
    id: "beta-carotene",
    nutrient: "Beta-carotene (vitamin A)",
    benefit: "Supports healthy skin cell turnover.",
    evidence: "emerging",
    examples: ["Sweet potato", "Carrots", "Pumpkin", "Mango"],
    allergens: [],
  },
  {
    id: "selenium",
    nutrient: "Selenium",
    benefit: "Antioxidant mineral that protects skin cells.",
    evidence: "emerging",
    examples: ["Brazil nuts", "Sunflower seeds", "Eggs"],
    allergens: ["nuts", "egg"],
  },
  {
    id: "hydration",
    nutrient: "Water-rich foods",
    benefit: "Support skin hydration and the moisture barrier.",
    evidence: "traditional",
    examples: ["Cucumber", "Watermelon", "Coconut water"],
    allergens: [],
  },
];

/**
 * Normalizes a free-text allergen/trigger into a canonical category token so
 * that plurals and common synonyms match the curated `allergens` labels
 * (e.g. "eggs" → "egg", "milk"/"lactose" → "dairy", "prawns" → "shellfish").
 */
const ALLERGEN_SYNONYMS: Record<string, string> = {
  eggs: "egg",
  egg: "egg",
  milk: "dairy",
  lactose: "dairy",
  cheese: "dairy",
  dairy: "dairy",
  peanut: "peanut",
  peanuts: "peanut",
  nut: "nut",
  nuts: "nut",
  "tree nut": "nut",
  "tree nuts": "nut",
  shellfish: "shellfish",
  prawn: "shellfish",
  prawns: "shellfish",
  shrimp: "shellfish",
  crab: "shellfish",
  crabs: "shellfish",
  fish: "fish",
  gluten: "gluten",
  wheat: "gluten",
  soy: "soy",
  soya: "soy",
  sesame: "sesame",
};

function normalizeTerm(value: string): string {
  const t = value.trim().toLowerCase();
  return ALLERGEN_SYNONYMS[t] ?? t;
}

function tokenize(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Returns the personalised list of foods to eat, excluding any food that
 * overlaps with the user's known allergens or confirmed triggers.
 * Matching is word-boundary based so "egg" never hides "eggplant" and
 * "chicken rice" never hides "brown rice".
 */
export function getFoodsToEat(
  knownAllergens: string[] = [],
  knownTriggers: string[] = []
): EatClearFood[] {
  const blocked = new Set(
    [...knownAllergens, ...knownTriggers]
      .map((s) => normalizeTerm(s ?? ""))
      .filter(Boolean)
  );

  if (blocked.size === 0) return [...SKIN_FOODS];

  return SKIN_FOODS.filter((food) => {
    if (food.allergens.some((a) => blocked.has(normalizeTerm(a)))) return false;
    if (blocked.has(normalizeTerm(food.nutrient))) return false;

    for (const example of food.examples) {
      if (blocked.has(normalizeTerm(example))) return false;
      const words = tokenize(example);
      if (words.some((w) => blocked.has(normalizeTerm(w)))) return false;
    }
    return true;
  });
}

/** All curated foods, as a fresh copy (used for testing and fallback). */
export function getAllSkinFoods(): EatClearFood[] {
  return [...SKIN_FOODS];
}
