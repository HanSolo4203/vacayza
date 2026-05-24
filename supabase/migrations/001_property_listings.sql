-- Run this in Supabase Dashboard → SQL Editor (project: oiwttbiwxgpughghtusk)
-- Do NOT paste the TypeScript from route.ts — only this file.

CREATE TABLE IF NOT EXISTS property_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source_url TEXT NOT NULL,
  title TEXT,
  address TEXT,
  suburb TEXT,
  price BIGINT,
  bedrooms INT,
  bathrooms INT,
  parking INT,
  size_sqm INT,
  property_type TEXT,
  description TEXT,
  images JSONB,
  features JSONB,
  transfer_duty BIGINT,
  total_acquisition_cost BIGINT,
  str_data JSONB,
  ltr_data JSONB,
  recommendation TEXT,
  slug TEXT UNIQUE,
  published BOOLEAN DEFAULT FALSE,
  agent_notes TEXT,
  vacayza_score INT,
  listing_status TEXT
);

ALTER TABLE property_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published" ON property_listings;
CREATE POLICY "Public read published" ON property_listings
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Anon insert" ON property_listings;
CREATE POLICY "Anon insert" ON property_listings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update" ON property_listings;
CREATE POLICY "Anon update" ON property_listings
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anon read all" ON property_listings;
CREATE POLICY "Anon read all" ON property_listings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon delete" ON property_listings;
CREATE POLICY "Anon delete" ON property_listings
  FOR DELETE USING (true);
