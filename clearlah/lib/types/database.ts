/**
 * Database type definitions for ClearLah Supabase schema.
 * These types mirror the Supabase table structures defined in E1-S2.
 */

// ─── Supabase Auth User (minimal) ─────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
}

// ─── users table ──────────────────────────────────────────────────────────────
export interface DbUser {
  id: string;
  /** Nullable — mirrors the `text` (nullable) SQL column. Always null-check before use. */
  email: string | null;
  created_at: string;
  onboarding_complete: boolean;
}

// ─── user_profiles table ──────────────────────────────────────────────────────
export type TrackingFor = "myself" | "my_child" | "someone_else";

export type Condition =
  | "eczema"
  | "ibs"
  | "food_allergy"
  | "asthma"
  | "other";

export interface DbUserProfile {
  user_id: string;
  tracking_for: TrackingFor | null;
  conditions: Condition[];
  disclaimer_acknowledged: boolean;
  /** Cached trigger analysis results (last computed) */
  trigger_cache: TriggerCache | null;
  singlish_unlocked: boolean;
  /** Onboarding step tracker: 1=fresh, 2=Day2 asked, 3=Day3 asked */
  onboarding_step: 1 | 2 | 3;
  known_allergens: string[];
  daily_skincare: string | null;
  streak: number;
  streak_last_date: string | null; // ISO date YYYY-MM-DD
  updated_at: string;
}

// ─── log_entries table ────────────────────────────────────────────────────────
export interface FoodLog {
  items: FoodItem[];
  notes?: string;
}

export interface FoodItem {
  name: string;
  /** Hawker dish ID if matched */
  dish_id?: string;
  serving?: string;
  meal?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface LifestyleLog {
  sleep_hours: number | null;
  /** 1–5 */
  stress_level: number | null;
  stress_type: "work" | "relationship" | "physical" | "financial" | "other" | null;
  exercise_minutes?: number | null;
  water_ml?: number | null;
}

export interface SymptomsLog {
  /** 1–10, null if not applicable to user's condition */
  skin: number | null;
  gut: number | null;
  respiratory: number | null;
  notes?: string;
}

/** The four independent signals that make up a weather reading. */
export type WeatherSignal = "temp" | "humidity" | "psi" | "uv";

export interface WeatherSnapshot {
  temp: number;        // Celsius, mean across reporting stations
  humidity: number;    // Percentage, mean across reporting stations
  psi: number;         // Pollutant Standards Index, mean across the 5 regions
  uv: number;          // UV Index
  // "partial" means some signals are live and others were substituted from mock —
  // NEA publishes UV only across daylight hours, so this is the normal night state.
  source: "live" | "mock" | "partial";
  simulated?: true;    // set only when every signal is mock
  simulated_fields: WeatherSignal[]; // empty when source is "live"
  fetched_at: string;  // ISO timestamp of the oldest live observation, not of the request
}

export interface DbLogEntry {
  id: string;
  user_id: string;
  logged_at: string; // ISO date YYYY-MM-DD
  food: FoodLog;
  lifestyle: LifestyleLog;
  skincare: string | null;
  symptoms: SymptomsLog;
  weather_snapshot: WeatherSnapshot | null;
  created_at: string;
}

// ─── hawker_dishes table ──────────────────────────────────────────────────────
export type HawkerCategory =
  | "noodles"
  | "rice"
  | "soup"
  | "grilled"
  | "fried"
  | "dessert"
  | "drinks"
  | "bread_pastry"
  | "other";

export interface DbHawkerDish {
  id: string;
  name_en: string;
  name_ms: string | null;
  name_zh: string | null;
  /** Alternative spellings / abbreviations for fuzzy search */
  aliases: string[];
  /** e.g. ["shellfish", "gluten", "eggs", "dairy"] */
  allergens: string[];
  category: HawkerCategory;
  popularity_rank: number;
}

// ─── saved_dishes table ───────────────────────────────────────────────────────
export type SafetyLabel = "safe" | "risky" | "avoid";

export interface DbSavedDish {
  id: string;
  user_id: string;
  dish_id: string;
  safety_label: SafetyLabel;
  saved_at: string;
}

// ─── Trigger Cache (stored in user_profiles.trigger_cache) ───────────────────
export interface TriggerCache {
  computed_at: string;
  top_triggers: TriggerEntry[];
  /** Days since last high-risk day */
  days_since_high_risk: number | null;
  pattern_summary: string; // AI-generated one-liner
}

export interface TriggerEntry {
  factor: string; // e.g. "shellfish", "humidity > 80%", "sleep < 6h"
  correlation: number; // 0.0–1.0
  occurrences: number;
  condition: Condition;
}

// ─── API Response Types ───────────────────────────────────────────────────────
/**
 * Wire format of GET /api/weather. Identical to WeatherSnapshot so the response
 * can be persisted directly into DbLogEntry.weather_snapshot without a consumer
 * having to invent a fetched_at at receive time.
 *
 * Consumers running correlation analysis must exclude signals listed in
 * simulated_fields — mock values are constants and will otherwise manufacture
 * spurious correlations against symptom data.
 */
export type WeatherApiResponse = WeatherSnapshot;

export interface SeedApiResponse {
  seeded: boolean;
  entries: number;
}

// ─── AI Parse Log Types ──────────────────────────────────────────────────────
export interface ParseLogRequest {
  message: string;
  userProfile?: {
    conditions: string[];
    known_allergens: string[];
  };
}

export interface ParsedLog {
  food: { items: string[]; hawker_dishes: string[] };
  lifestyle: { sleep_hours: number | null; stress_level: number | null; stress_type: string | null };
  skincare: string | null;
  symptoms: { skin: number | null; gut: number | null; respiratory: number | null };
  summary: string;
}

export type ParseLogResponse =
  | { success: true; parsed: ParsedLog }
  | { success: false; error: "ai_unavailable"; partial: Partial<ParsedLog> };
