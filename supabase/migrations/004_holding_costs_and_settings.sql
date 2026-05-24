-- Holding costs on listings + global app settings (maintenance reserve %)

ALTER TABLE property_listings
  ADD COLUMN IF NOT EXISTS levies BIGINT,
  ADD COLUMN IF NOT EXISTS rates_and_taxes BIGINT;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES ('maintenance_reserve_pct', '5')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON app_settings;
CREATE POLICY "Public read settings" ON app_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon update settings" ON app_settings;
CREATE POLICY "Anon update settings" ON app_settings
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anon insert settings" ON app_settings;
CREATE POLICY "Anon insert settings" ON app_settings
  FOR INSERT WITH CHECK (true);
