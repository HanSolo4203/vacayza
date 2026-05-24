-- Suburb-level STR/LTR market rate assumptions (editable in admin)

CREATE TABLE IF NOT EXISTS market_rates (
  suburb TEXT NOT NULL,
  bedroom_key TEXT NOT NULL,
  str_nightly_rate BIGINT NOT NULL,
  str_occupancy_pct NUMERIC(5, 2) NOT NULL,
  ltr_monthly_rent BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (suburb, bedroom_key)
);

ALTER TABLE market_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read market rates" ON market_rates;
CREATE POLICY "Public read market rates" ON market_rates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon update market rates" ON market_rates;
CREATE POLICY "Anon update market rates" ON market_rates
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anon insert market rates" ON market_rates;
CREATE POLICY "Anon insert market rates" ON market_rates
  FOR INSERT WITH CHECK (true);

-- Seed from Vacayza default Cape Town assumptions
INSERT INTO market_rates (suburb, bedroom_key, str_nightly_rate, str_occupancy_pct, ltr_monthly_rent) VALUES
  ('cape-town-city-centre', 'studio', 1500, 74, 9000),
  ('cape-town-city-centre', '1', 2400, 76, 14000),
  ('cape-town-city-centre', '2', 3800, 74, 22000),
  ('cape-town-city-centre', '3', 6500, 68, 32000),
  ('de-waterkant', 'studio', 2000, 80, 11000),
  ('de-waterkant', '1', 3000, 82, 17000),
  ('de-waterkant', '2', 5000, 80, 28000),
  ('de-waterkant', '3', 8000, 74, 40000),
  ('sea-point', 'studio', 2200, 78, 10000),
  ('sea-point', '1', 3200, 80, 15500),
  ('sea-point', '2', 5500, 78, 26000),
  ('sea-point', '3', 9000, 72, 38000),
  ('camps-bay', 'studio', 3200, 72, 14000),
  ('camps-bay', '1', 4500, 74, 22000),
  ('camps-bay', '2', 7500, 76, 38000),
  ('camps-bay', '3', 14000, 70, 60000),
  ('green-point', 'studio', 1800, 76, 9500),
  ('green-point', '1', 2800, 78, 15000),
  ('green-point', '2', 4500, 76, 24000),
  ('green-point', '3', 7500, 70, 36000),
  ('waterfront', 'studio', 2500, 82, 13000),
  ('waterfront', '1', 3800, 84, 20000),
  ('waterfront', '2', 6500, 82, 35000),
  ('waterfront', '3', 11000, 76, 55000)
ON CONFLICT (suburb, bedroom_key) DO NOTHING;
