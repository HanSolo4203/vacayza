import { matchRsaPropertyId, type RsaListingMatchInput } from "./rsa-property-match";
import { createSupabaseClientSafe } from "./supabase";
import { normalizeSuburbForRsa, rsaSuburbLabel } from "./rsa-suburbs";
import type { ConfidenceLevel, MarketBenchmark, SuburbIndexRow } from "./uplisting-parser";
import { calculateSeasonalIndex, fillBenchmarkGaps, getConfidenceLevel } from "./uplisting-parser";

export interface RsaStrProjection {
  adr: number;
  occupancy: number;
  annualRevenue: number;
  netAnnual: number;
  seasonalIndex: Record<string, number>;
  confidence: ConfidenceLevel;
  sampleSize: number;
  dataFrom: string | null;
  dataTo: string | null;
  source: string;
  suburb: string;
  suburbDisplay: string;
  /** Set when projection comes from a single mapped Uplisting property. */
  propertyName?: string;
  uplistingPropertyId?: string;
}

interface DbBenchmark {
  suburb: string;
  bedrooms: number;
  sample_size: number | null;
  avg_adr: number | null;
  avg_occupancy_pct: number | null;
  avg_annual_revenue: number | null;
  seasonal_index: Record<string, number> | null;
  channel_mix: Record<string, number> | null;
  confidence_level: string | null;
  data_from: string | null;
  data_to: string | null;
}

function dbToBenchmark(row: DbBenchmark): MarketBenchmark {
  return {
    suburb: row.suburb,
    bedrooms: row.bedrooms,
    sample_size: row.sample_size ?? 0,
    avg_adr: row.avg_adr ?? 0,
    avg_occupancy_pct: row.avg_occupancy_pct ?? 0,
    avg_annual_revenue: row.avg_annual_revenue ?? 0,
    seasonal_index: row.seasonal_index ?? {},
    channel_mix: row.channel_mix ?? {},
    confidence_level: (row.confidence_level as ConfidenceLevel) ?? "FALLBACK",
    data_from: row.data_from ?? "",
    data_to: row.data_to ?? "",
  };
}

export function benchmarkToStrProjection(
  benchmark: MarketBenchmark,
  suburbDisplay?: string,
): RsaStrProjection {
  const annual = benchmark.avg_annual_revenue;
  return {
    adr: benchmark.avg_adr,
    occupancy: benchmark.avg_occupancy_pct,
    annualRevenue: annual,
    netAnnual: Math.round(annual * 0.8),
    seasonalIndex: benchmark.seasonal_index,
    confidence: benchmark.confidence_level,
    sampleSize: benchmark.sample_size,
    dataFrom: benchmark.data_from || null,
    dataTo: benchmark.data_to || null,
    source: "Right Stay Africa Portfolio Data",
    suburb: benchmark.suburb,
    suburbDisplay: suburbDisplay ?? rsaSuburbLabel(benchmark.suburb),
  };
}

export function strDataSourceLabel(projection: RsaStrProjection): string {
  if (projection.propertyName) {
    const idSuffix = projection.uplistingPropertyId
      ? ` (Uplisting #${projection.uplistingPropertyId})`
      : "";
    return `— Based on RSA Uplisting booking data for ${projection.propertyName}${idSuffix}`;
  }

  const suburb = projection.suburbDisplay;
  const n = projection.sampleSize;
  switch (projection.confidence) {
    case "HIGH":
      return `— Based on ${n} Right Stay Africa properties in ${suburb}`;
    case "MEDIUM":
      return `— Based on ${n} RSA properties in ${suburb} (indicative)`;
    case "LOW":
      return `— Based on 1 RSA property in ${suburb} (indicative)`;
    default:
      return "— Market estimate based on Cape Town STR averages";
  }
}

export async function getSuburbIndexRows(): Promise<SuburbIndexRow[]> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return [];

  const { data } = await supabase.from("suburb_index").select("*");
  return (data ?? []).map((row) => ({
    suburb: row.suburb,
    suburb_display: row.suburb_display,
    adr_index: Number(row.adr_index) || 1,
  }));
}

export async function getRsaBenchmark(
  rawSuburb: string,
  bedrooms: number,
): Promise<RsaStrProjection | null> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return null;

  const suburb = normalizeSuburbForRsa(rawSuburb);
  const bedKey = bedrooms === 0 ? 0 : Math.min(Math.max(bedrooms, 1), 3);

  const { data: direct } = await supabase
    .from("rsa_market_benchmarks")
    .select("*")
    .eq("suburb", suburb)
    .eq("bedrooms", bedKey)
    .maybeSingle();

  if (direct?.avg_adr) {
    return benchmarkToStrProjection(dbToBenchmark(direct as DbBenchmark));
  }

  const [{ data: cityCentre }, suburbIndex] = await Promise.all([
    supabase
      .from("rsa_market_benchmarks")
      .select("*")
      .eq("suburb", "city-centre")
      .eq("bedrooms", bedKey)
      .maybeSingle(),
    getSuburbIndexRows(),
  ]);

  if (!cityCentre?.avg_adr) return null;

  const indexRows =
    suburbIndex.length > 0
      ? suburbIndex
      : [{ suburb: "city-centre", suburb_display: "City Centre", adr_index: 1 }];

  const filled = fillBenchmarkGaps(
    [dbToBenchmark(cityCentre as DbBenchmark)],
    indexRows,
  );
  const scaled = filled.find((b) => b.suburb === suburb && b.bedrooms === bedKey);
  if (!scaled) return null;

  return benchmarkToStrProjection(scaled);
}

interface DbPropertyStats {
  uplisting_property_id: string;
  data_from: string | null;
  data_to: string | null;
  adr: number | null;
  occupancy_pct: number | null;
  annual_revenue_run_rate: number | null;
  monthly_revenue: Record<string, number> | null;
  total_bookings: number | null;
}

interface DbRsaProperty {
  uplisting_property_id: string;
  display_name: string | null;
  suburb: string;
  suburb_display: string;
  bedrooms: number;
}

function propertyStatsToProjection(
  stat: DbPropertyStats,
  property: DbRsaProperty,
): RsaStrProjection | null {
  const adr = stat.adr ?? 0;
  const occupancy = stat.occupancy_pct ?? 0;
  const annual = stat.annual_revenue_run_rate ?? 0;
  if (adr <= 0 || annual <= 0) return null;

  const bookings = stat.total_bookings ?? 0;
  const { level } = getConfidenceLevel(Math.max(bookings, 1));

  return {
    adr,
    occupancy,
    annualRevenue: annual,
    netAnnual: Math.round(annual * 0.8),
    seasonalIndex: calculateSeasonalIndex(stat.monthly_revenue ?? {}),
    confidence: bookings >= 1 ? level : "FALLBACK",
    sampleSize: bookings,
    dataFrom: stat.data_from,
    dataTo: stat.data_to,
    source: "Right Stay Africa Uplisting Property Data",
    suburb: property.suburb,
    suburbDisplay: property.suburb_display,
    propertyName: property.display_name ?? undefined,
    uplistingPropertyId: property.uplisting_property_id,
  };
}

/** STR projection from a single RSA property's latest Uplisting stats. */
export async function getRsaPropertyBenchmark(
  uplistingPropertyId: string,
): Promise<RsaStrProjection | null> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return null;

  const [{ data: property }, { data: stat }] = await Promise.all([
    supabase
      .from("rsa_properties")
      .select("uplisting_property_id, display_name, suburb, suburb_display, bedrooms")
      .eq("uplisting_property_id", uplistingPropertyId)
      .maybeSingle(),
    supabase
      .from("rsa_property_stats")
      .select(
        "uplisting_property_id, data_from, data_to, adr, occupancy_pct, annual_revenue_run_rate, monthly_revenue, total_bookings",
      )
      .eq("uplisting_property_id", uplistingPropertyId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!property || !stat) return null;
  return propertyStatsToProjection(stat as DbPropertyStats, property as DbRsaProperty);
}

/**
 * Prefer a matched Uplisting property's own booking stats; otherwise suburb benchmark.
 */
export async function resolveRsaProjectionForListing(
  input: RsaListingMatchInput & { suburb: string; bedrooms: number },
): Promise<RsaStrProjection | null> {
  const matchedId = await matchRsaPropertyId(input);
  if (matchedId) {
    const propertyProjection = await getRsaPropertyBenchmark(matchedId);
    if (propertyProjection) return propertyProjection;
  }
  return getRsaBenchmark(input.suburb, input.bedrooms);
}

/** Map RSA portfolio benchmark into nightly-rate STR metrics shape. */
export function rsaProjectionToNightlyMetrics(projection: RsaStrProjection) {
  const nightlyRate = projection.adr;
  const occupancyPct = projection.occupancy;
  const grossAnnual = projection.annualRevenue;
  const netAfterManagement = projection.netAnnual;
  return { nightlyRate, occupancyPct, grossAnnual, netAfterManagement };
}
