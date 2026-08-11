-- Add ai_feedback_log column to user_profiles for AI feedback learning loop (E7-S2)
-- Stores user corrections on AI parse accuracy as JSONB array.
-- Max 20 entries enforced at application level.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ai_feedback_log jsonb DEFAULT '[]'::jsonb;
