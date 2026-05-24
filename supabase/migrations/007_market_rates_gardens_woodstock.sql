-- Gardens & Woodstock STR/LTR market rate rows (aligned with suburb_index scaling)

INSERT INTO market_rates (suburb, bedroom_key, str_nightly_rate, str_occupancy_pct, ltr_monthly_rent) VALUES
  ('gardens', 'studio', 1425, 74, 8550),
  ('gardens', '1', 2280, 76, 13300),
  ('gardens', '2', 3610, 74, 20900),
  ('gardens', '3', 6175, 68, 30400),
  ('woodstock', 'studio', 1125, 72, 6750),
  ('woodstock', '1', 1800, 74, 10500),
  ('woodstock', '2', 2850, 72, 16500),
  ('woodstock', '3', 4875, 66, 24000)
ON CONFLICT (suburb, bedroom_key) DO NOTHING;
