/*
 * Supabase migrations — copy ONLY from:
 *   supabase/migrations/001_property_listings.sql
 *   supabase/migrations/006_rsa_uplisting_market.sql
 * (Do not run this .ts file in the SQL editor.)
 *
 * CREATE TABLE property_listings (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   source_url TEXT NOT NULL,
 *   title TEXT,
 *   address TEXT,
 *   suburb TEXT,
 *   price BIGINT,
 *   bedrooms INT,
 *   bathrooms INT,
 *   parking INT,
 *   size_sqm INT,
 *   property_type TEXT,
 *   description TEXT,
 *   images JSONB,
 *   features JSONB,
 *   transfer_duty BIGINT,
 *   total_acquisition_cost BIGINT,
 *   str_data JSONB,
 *   ltr_data JSONB,
 *   recommendation TEXT,
 *   slug TEXT UNIQUE,
 *   published BOOLEAN DEFAULT FALSE,
 *   agent_notes TEXT,
 *   vacayza_score INT,
 *   listing_status TEXT
 * );
 *
 * ALTER TABLE property_listings ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Public read published" ON property_listings
 *   FOR SELECT USING (published = true);
 *
 * CREATE POLICY "Anon insert" ON property_listings
 *   FOR INSERT WITH CHECK (true);
 *
 * CREATE POLICY "Anon read all" ON property_listings
 *   FOR SELECT USING (true);
 *
 * CREATE POLICY "Anon delete" ON property_listings
 *   FOR DELETE USING (true);
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateInvestmentMetricsWithSettings } from "../../../lib/investment-server";
import { inferPropertyType } from "../../../lib/investment";
import { resolveRsaProjectionForListing } from "../../../lib/rsa-benchmarks";
import { normalizeSuburbForRsa } from "../../../lib/rsa-suburbs";
import { fetchProperty24ListingHtml, normalizeProperty24Url } from "../../../lib/property24-fetch";
import { scrapeProperty24Listing } from "../../../lib/property24-scraper";
import { savePropertyListing } from "../../../lib/save-property-listing";
import type { PropertyListingData } from "../../../lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

async function buildStrBenchmarkPayload(
  listing: Pick<PropertyListingData, "suburb" | "bedrooms" | "title" | "address" | "description">,
) {
  const detectedSuburb = normalizeSuburbForRsa(listing.suburb);
  const projection = await resolveRsaProjectionForListing(listing);
  if (projection) {
    return {
      adr: projection.adr,
      occupancy: projection.occupancy,
      annualRevenue: projection.annualRevenue,
      netAnnual: projection.netAnnual,
      seasonalIndex: projection.seasonalIndex,
      confidence: projection.confidence,
      sampleSize: projection.sampleSize,
      dataFrom: projection.dataFrom,
      dataTo: projection.dataTo,
      source: projection.source,
      suburb: detectedSuburb,
    };
  }
  return null;
}

async function persistScrapedListing(
  data: PropertyListingData,
  body: Record<string, unknown>,
): Promise<{ id: string; slug: string } | null> {
  if (body.save !== true) return null;

  return savePropertyListing(data, {
    published: body.published === true,
    agentNotes: typeof body.agentNotes === "string" ? body.agentNotes : undefined,
    vacayzaScore: Number(body.vacayzaScore) || undefined,
    existingId: typeof body.existingId === "string" ? body.existingId : undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const manual = body.manual === true ? body.data : null;

    if (manual) {
      const price = Number(manual.price) || 0;
      if (price <= 0) {
        return NextResponse.json({
          success: false,
          error: "Price is required for manual entry.",
        });
      }

      const base = {
        sourceUrl: manual.sourceUrl || "",
        title: manual.title || "Manual Property Listing",
        address: manual.address || manual.suburb || "Cape Town",
        suburb: manual.suburb || "cape-town-city-centre",
        price,
        bedrooms: Number(manual.bedrooms) ?? 1,
        bathrooms: Number(manual.bathrooms) ?? 1,
        parking: Number(manual.parking) ?? 0,
        size: Number(manual.size) ?? 0,
        propertyType: manual.propertyType || inferPropertyType(manual.title || "", Number(manual.bedrooms) ?? 1),
        description: manual.description || "",
        images: Array.isArray(manual.images) ? manual.images : [],
        features: Array.isArray(manual.features) ? manual.features : [],
        listingStatus: manual.listingStatus || "For Sale",
        levies: manual.levies != null ? Number(manual.levies) : undefined,
        ratesAndTaxes: manual.ratesAndTaxes != null ? Number(manual.ratesAndTaxes) : undefined,
      };

      const metrics = await calculateInvestmentMetricsWithSettings(base);
      const data: PropertyListingData = { ...base, ...metrics };
      const strBenchmark = await buildStrBenchmarkPayload(base);

      const saved = await persistScrapedListing(data, body);

      return NextResponse.json({
        success: true,
        data,
        str: strBenchmark,
        ...(saved ? { id: saved.id, slug: saved.slug, saved: true } : {}),
      });
    }

    if (!url || !url.includes("property24.com")) {
      return NextResponse.json({
        success: false,
        error: "Please provide a valid Property24 URL.",
      });
    }

    let normalizedUrl = url;
    try {
      normalizedUrl = normalizeProperty24Url(url);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Please provide a valid Property24 URL.",
      });
    }

    const html = await fetchProperty24ListingHtml(normalizedUrl);
    const scraped = scrapeProperty24Listing(html, normalizedUrl);

    if (scraped.price <= 0) {
      return NextResponse.json({
        success: false,
        error:
          "Fetched the listing page but could not read a price. The listing may have been removed or changed on Property24.",
      });
    }

    const metrics = await calculateInvestmentMetricsWithSettings(scraped);
    const data: PropertyListingData = { ...scraped, ...metrics };
    const strBenchmark = await buildStrBenchmarkPayload(scraped);

    const saved = await persistScrapedListing(data, body);

    return NextResponse.json({
      success: true,
      data,
      str: strBenchmark,
      ...(saved ? { id: saved.id, slug: saved.slug, saved: true } : {}),
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const message = raw.includes("Proxy fetch")
      ? "Property24 blocked the direct request and the fallback fetch also failed. Try again in a few seconds."
      : raw || "Unable to scrape listing. Property24 may be blocking the request. Try again in a few seconds.";

    return NextResponse.json({
      success: false,
      error: message,
    });
  }
}
