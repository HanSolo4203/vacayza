-- Right Stay Africa Uplisting CSV market data (portfolio-derived benchmarks)

CREATE TABLE IF NOT EXISTS rsa_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uplisting_property_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  suburb TEXT NOT NULL,
  suburb_display TEXT NOT NULL,
  bedrooms INT NOT NULL,
  property_type TEXT DEFAULT 'apartment',
  max_guests INT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rsa_property_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uplisting_property_id TEXT NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  data_from DATE,
  data_to DATE,
  adr INTEGER,
  occupancy_pct INTEGER,
  annual_revenue_run_rate INTEGER,
  monthly_revenue JSONB,
  channel_breakdown JSONB,
  total_bookings INTEGER,
  total_nights_booked INTEGER,
  total_revenue INTEGER
);

CREATE TABLE IF NOT EXISTS rsa_market_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  suburb TEXT NOT NULL,
  bedrooms INT NOT NULL,
  sample_size INT,
  avg_adr INTEGER,
  avg_occupancy_pct INTEGER,
  avg_annual_revenue INTEGER,
  seasonal_index JSONB,
  channel_mix JSONB,
  confidence_level TEXT,
  data_from DATE,
  data_to DATE,
  UNIQUE(suburb, bedrooms)
);

CREATE TABLE IF NOT EXISTS suburb_index (
  suburb TEXT PRIMARY KEY,
  suburb_display TEXT,
  adr_index DECIMAL DEFAULT 1.0,
  notes TEXT
);

INSERT INTO suburb_index (suburb, suburb_display, adr_index, notes) VALUES
  ('camps-bay', 'Camps Bay', 2.60, 'Premium coastal'),
  ('waterfront', 'V&A Waterfront', 2.00, 'Tourist hub'),
  ('de-waterkant', 'De Waterkant', 1.65, 'Trendy village'),
  ('sea-point', 'Sea Point', 1.50, 'Beachfront strip'),
  ('green-point', 'Green Point', 1.30, 'Stadium precinct'),
  ('city-centre', 'City Centre', 1.00, 'Baseline from PriceLabs'),
  ('gardens', 'Gardens', 0.95, 'Near CBD'),
  ('woodstock', 'Woodstock', 0.75, 'Up and coming')
ON CONFLICT (suburb) DO NOTHING;

ALTER TABLE rsa_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsa_property_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsa_market_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE suburb_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read rsa properties" ON rsa_properties;
CREATE POLICY "Public read rsa properties" ON rsa_properties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon all rsa properties" ON rsa_properties;
CREATE POLICY "Anon all rsa properties" ON rsa_properties FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read rsa property stats" ON rsa_property_stats;
CREATE POLICY "Public read rsa property stats" ON rsa_property_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon all rsa property stats" ON rsa_property_stats;
CREATE POLICY "Anon all rsa property stats" ON rsa_property_stats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read rsa benchmarks" ON rsa_market_benchmarks;
CREATE POLICY "Public read rsa benchmarks" ON rsa_market_benchmarks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon all rsa benchmarks" ON rsa_market_benchmarks;
CREATE POLICY "Anon all rsa benchmarks" ON rsa_market_benchmarks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read suburb index" ON suburb_index;
CREATE POLICY "Public read suburb index" ON suburb_index FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon all suburb index" ON suburb_index;
CREATE POLICY "Anon all suburb index" ON suburb_index FOR ALL USING (true) WITH CHECK (true);
