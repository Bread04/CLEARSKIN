-- Privacy controls for FlarePrint location sharing
-- Both default to false; community sharing is a separate explicit opt-in

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS location_enabled BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS community_sharing BOOLEAN DEFAULT false;
