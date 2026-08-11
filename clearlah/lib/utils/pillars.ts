import type { Condition } from "@/lib/types/database";

export interface ConditionMeta {
  symptomLabel: string;
  promptHint: string;
}

export const CONDITION_LABEL_MAP: Record<Condition, ConditionMeta> = {
  eczema: {
    symptomLabel: "Skin Flares",
    promptHint: "skin symptoms (itching, redness, dryness)",
  },
  ibs: {
    symptomLabel: "Gut Symptoms",
    promptHint: "digestive symptoms (bloating, pain, bowel changes)",
  },
  food_allergy: {
    symptomLabel: "Reactions",
    promptHint: "allergy reactions (hives, swelling, itching)",
  },
  asthma: {
    symptomLabel: "Breathing",
    promptHint: "breathing symptoms (wheeze, cough, tightness)",
  },
  other: {
    symptomLabel: "Symptoms",
    promptHint: "general symptoms",
  },
};

/**
 * Returns the personalised symptom pillar label for the first condition
 * in the user's conditions array. Falls back to "Symptoms" if array is empty.
 */
export function getSymptomPillarLabel(conditions: Condition[]): string {
  if (conditions.length === 0) return "Symptoms";
  const first = conditions[0];
  return CONDITION_LABEL_MAP[first].symptomLabel;
}

export const CONDITION_DISPLAY: { value: Condition; label: string; subtitle: string }[] = [
  {
    value: "eczema",
    label: "Eczema",
    subtitle: "itching, redness, dry or inflamed skin",
  },
  {
    value: "ibs",
    label: "IBS",
    subtitle: "bloating, cramping, bowel changes",
  },
  {
    value: "food_allergy",
    label: "Food allergy",
    subtitle: "hives, swelling, itching after eating",
  },
  {
    value: "asthma",
    label: "Asthma",
    subtitle: "wheezing, coughing, chest tightness",
  },
  {
    value: "other",
    label: "Other",
    subtitle: "another chronic condition not listed above",
  },
];
