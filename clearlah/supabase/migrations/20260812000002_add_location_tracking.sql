-- Add location tracking to log_entries and community aggregation table
-- Privacy-first: location disabled by default, community sharing requires second opt-in

ALTER TABLE log_entries
ADD COLUMN IF NOT EXISTS location jsonb;

CREATE TABLE IF NOT EXISTS community_flares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_cell_id TEXT NOT NULL,
  flare_count INTEGER NOT NULL DEFAULT 1 CHECK (flare_count >= 0),
  common_triggers TEXT[] DEFAULT '{}',
  avg_severity NUMERIC(3,1) DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_flares_grid ON community_flares(grid_cell_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_flares_unique ON community_flares(grid_cell_id);

ALTER TABLE community_flares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to community_flares"
  ON community_flares FOR SELECT
  USING (true);

CREATE POLICY "Allow upsert on community_flares"
  ON community_flares FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update on community_flares"
  ON community_flares FOR UPDATE
  USING (true);
