ALTER TABLE property_listings
  ADD COLUMN IF NOT EXISTS listing_status TEXT;
