-- ============================================================
-- ClearLah — Initial Schema Migration
-- Created: 2026-08-08
-- ============================================================

-- Enable trigram extension for fuzzy hawker dish search (AD-5, E6-S1)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── users ────────────────────────────────────────────────────────────────────
-- Mirrors Supabase Auth users; populated on first sign-in or demo seed.
CREATE TABLE IF NOT EXISTS users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  onboarding_complete boolean NOT NULL DEFAULT false
);

-- ─── user_profiles ────────────────────────────────────────────────────────────
-- One row per user; contains personalisation, streak state, and trigger cache.
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id                 uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tracking_for            text CHECK (tracking_for IN ('myself', 'my_child', 'someone_else')),
  conditions              text[] NOT NULL DEFAULT '{}',
  disclaimer_acknowledged boolean NOT NULL DEFAULT false,
  trigger_cache           jsonb,
  singlish_unlocked       boolean NOT NULL DEFAULT false,
  onboarding_step         int NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 3),
  known_allergens         text[] NOT NULL DEFAULT '{}',
  daily_skincare          text,
  streak                  int NOT NULL DEFAULT 0 CHECK (streak >= 0),
  streak_last_date        date,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Auto-refresh updated_at on every UPDATE to user_profiles
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── log_entries ──────────────────────────────────────────────────────────────
-- One row per user per day. JSONB columns store structured pillar data.
CREATE TABLE IF NOT EXISTS log_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at        date NOT NULL,
  food             jsonb NOT NULL DEFAULT '{"items":[]}',
  lifestyle        jsonb NOT NULL DEFAULT '{}',
  skincare         text,
  symptoms         jsonb NOT NULL DEFAULT '{"skin":null,"gut":null,"respiratory":null}',
  weather_snapshot jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- One log entry per user per day
  UNIQUE (user_id, logged_at)
);

-- Index for fetching a user's log entries in date order (pattern engine, insights)
CREATE INDEX IF NOT EXISTS idx_log_entries_user_date
  ON log_entries (user_id, logged_at DESC);

-- ─── hawker_dishes ────────────────────────────────────────────────────────────
-- Static lookup table seeded by seed.sql.
-- pg_trgm GIN index enables fuzzy search across EN/Malay/Chinese names.
CREATE TABLE IF NOT EXISTS hawker_dishes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en         text NOT NULL,
  name_ms         text,
  name_zh         text,
  aliases         text[] NOT NULL DEFAULT '{}',
  allergens       text[] NOT NULL DEFAULT '{}',
  category        text NOT NULL DEFAULT 'other' CHECK (category IN ('noodles','rice','soup','grilled','fried','dessert','drinks','bread_pastry','other')),
  popularity_rank int NOT NULL DEFAULT 99
);

-- Trigram index for fuzzy text search on English name and aliases
CREATE INDEX IF NOT EXISTS idx_hawker_dishes_name_en_trgm
  ON hawker_dishes USING GIN (name_en gin_trgm_ops);

-- Trigram index on aliases array for fuzzy alias-based search (F10)
-- Note: GIN trigram on text[] requires an immutable wrapper; deferred to post-hackathon.
-- The idx_hawker_dishes_name_en_trgm index plus ILIKE/ANY on aliases is sufficient for MVP.

-- Index on allergens array for fast allergen filtering
CREATE INDEX IF NOT EXISTS idx_hawker_dishes_allergens
  ON hawker_dishes USING GIN (allergens);

-- ─── saved_dishes ─────────────────────────────────────────────────────────────
-- User-curated food guide: dishes marked as safe / risky / avoid.
CREATE TABLE IF NOT EXISTS saved_dishes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dish_id      uuid NOT NULL REFERENCES hawker_dishes(id) ON DELETE CASCADE,
  safety_label text NOT NULL CHECK (safety_label IN ('safe', 'risky', 'avoid')),
  saved_at     timestamptz NOT NULL DEFAULT now(),
  -- One save-record per user per dish
  UNIQUE (user_id, dish_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_dishes_user
  ON saved_dishes (user_id);

-- ─── Row-Level Security (RLS) ─────────────────────────────────────────────────
-- Enable RLS on user-scoped tables. In demo mode all API routes use
-- the service-role key which bypasses RLS — the policies below protect
-- production use when Supabase Auth is wired up post-hackathon.

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_dishes   ENABLE ROW LEVEL SECURITY;
-- hawker_dishes is public read, no RLS needed

-- Policies: service role (used by all API routes) bypasses RLS by default.
-- These policies are placeholders for when Supabase Auth is enabled.
-- users policies (F12: added INSERT + UPDATE)
CREATE POLICY "Users can read own row"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own row"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own row"
  ON users FOR UPDATE USING (auth.uid() = id);

-- user_profiles policies (F3: added INSERT)
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- log_entries policies (F4: added DELETE)
CREATE POLICY "Users can read own log entries"
  ON log_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own log entries"
  ON log_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own log entries"
  ON log_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own log entries"
  ON log_entries FOR DELETE USING (auth.uid() = user_id);

-- saved_dishes policies
CREATE POLICY "Users can read own saved dishes"
  ON saved_dishes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved dishes"
  ON saved_dishes FOR ALL USING (auth.uid() = user_id);
