-- Add check-in notification support to user_profiles
-- Allows users to configure evening check-in time for voice prompts

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS checkin_enabled BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '21:00:00';
