-- Run in Supabase SQL Editor if 001 was already applied without admin policies.

DROP POLICY IF EXISTS "Anon read all" ON property_listings;
CREATE POLICY "Anon read all" ON property_listings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon delete" ON property_listings;
CREATE POLICY "Anon delete" ON property_listings
  FOR DELETE USING (true);
