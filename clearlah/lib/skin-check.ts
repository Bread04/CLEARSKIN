/**
 * SkinCheck — wellness-grade eczema flare tracking.
 *
 * These pure helpers turn a vision model's raw output (a 0–10 severity score
 * plus observed indicators) into a tracking score + triage nudge. This is
 * self-monitoring and escalation guidance — explicitly NOT a diagnosis and NOT
 * treatment advice.
 */

export type SkinSeverity = "clear" | "mild" | "moderate" | "severe";

export interface SkinAssessment {
  score: number; // 0–10
  severity: SkinSeverity;
  indicators: string[];
  summary: string;
  selfCare: string[];
  escalate: boolean;
  escalationReason: string | null;
}

export const SKIN_DISCLAIMER =
  "This is a tracking score to help you monitor changes over time — not a medical diagnosis. If you're ever unsure, consult a dermatologist.";

const URGENT_INDICATORS = [
  "weeping",
  "oozing",
  "crusting",
  "infection",
  "wound",
  "blistering",
  "blister",
  "widespread",
  "pus",
  "bleeding",
  "fever",
];

const SELF_CARE = [
  "Moisturise with a fragrance-free emollient at least twice a day.",
  "Keep nails short and consider cool compresses to ease the urge to scratch.",
  "Shower with lukewarm (not hot) water and pat your skin dry gently.",
  "Stick to loose, breathable fabrics like cotton.",
  "Steer clear of the triggers you've already identified in your log.",
];

export function classifySeverity(score: number): SkinSeverity {
  if (score <= 1) return "clear";
  if (score <= 3) return "mild";
  if (score <= 6) return "moderate";
  return "severe";
}

function hasUrgentIndicator(indicators: string[]): boolean {
  return indicators.some((indicator) => {
    const words = indicator.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    return URGENT_INDICATORS.some((urgent) => words.includes(urgent));
  });
}

export function buildTriage(
  score: number,
  indicators: string[] = []
): { escalate: boolean; escalationReason: string | null; selfCare: string[] } {
  const hasUrgent = hasUrgentIndicator(indicators);
  const severe = classifySeverity(score) === "severe";
  const escalate = severe || hasUrgent;

  let escalationReason: string | null = null;
  if (escalate) {
    escalationReason = hasUrgent
      ? "Your skin shows signs that may need professional attention (for example weeping, crusting, or a possible infection)."
      : "Your skin appears to be flaring severely right now.";
  }

  return { escalate, escalationReason, selfCare: SELF_CARE };
}

/**
 * Clamps a raw score into the valid 0–10 range.
 */
export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}
