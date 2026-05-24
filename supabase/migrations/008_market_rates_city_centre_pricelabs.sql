-- Cape Town City Centre STR rates from PriceLabs market report (May 2026)
-- Median booked nightly price by bedroom; 73% market occupancy

INSERT INTO market_rates (suburb, bedroom_key, str_nightly_rate, str_occupancy_pct, ltr_monthly_rent) VALUES
  ('cape-town-city-centre', 'studio', 886, 73, 9000),
  ('cape-town-city-centre', '1', 1071, 73, 14000),
  ('cape-town-city-centre', '2', 1718, 73, 22000),
  ('cape-town-city-centre', '3', 2786, 73, 32000)
ON CONFLICT (suburb, bedroom_key) DO UPDATE SET
  str_nightly_rate = EXCLUDED.str_nightly_rate,
  str_occupancy_pct = EXCLUDED.str_occupancy_pct,
  updated_at = NOW();
