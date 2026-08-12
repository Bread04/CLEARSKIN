-- Stall Reports — crowd-sourced stall-level trigger data
-- Minimum 3 reports required before results are surfaced to users
-- All reports are anonymised; no user_id stored

CREATE TABLE IF NOT EXISTS stall_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_name TEXT NOT NULL,
  dish_id UUID REFERENCES hawker_dishes(id) ON DELETE CASCADE,
  reporter_count INTEGER NOT NULL DEFAULT 1 CHECK (reporter_count >= 0),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stall_reports_dish_id ON stall_reports(dish_id);
CREATE INDEX IF NOT EXISTS idx_stall_reports_stall_name ON stall_reports(stall_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stall_reports_unique ON stall_reports(stall_name, dish_id);

CREATE OR REPLACE TRIGGER trg_stall_reports_updated_at
  BEFORE UPDATE ON stall_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE stall_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to stall_reports"
  ON stall_reports FOR SELECT
  USING (true);

CREATE POLICY "Allow upsert on stall_reports"
  ON stall_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update on stall_reports"
  ON stall_reports FOR UPDATE
  USING (true);
