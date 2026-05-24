import { createSupabaseClientSafe } from "./supabase";

export const BEDROOM_KEYS = ["studio", "1", "2", "3"] as const;
export type BedroomKey = (typeof BEDROOM_KEYS)[number];

export const SUBURBS = [
  { value: "cape-town-city-centre", label: "Cape Town City Centre" },
  { value: "de-waterkant", label: "De Waterkant" },
  { value: "sea-point", label: "Sea Point" },
  { value: "camps-bay", label: "Camps Bay" },
  { value: "green-point", label: "Green Point" },
  { value: "waterfront", label: "Waterfront" },
  { value: "gardens", label: "Gardens" },
  { value: "woodstock", label: "Woodstock" },
] as const;

export interface MarketRateRow {
  suburb: string;
  bedroomKey: BedroomKey;
  strNightlyRate: number;
  strOccupancyPct: number;
  ltrMonthlyRent: number;
}

export interface MarketRatesTables {
  str: Record<string, Record<string, { rate: number; occ: number }>>;
  ltr: Record<string, Record<string, number>>;
}

export const DEFAULT_MARKET_RATES: MarketRatesTables = {
  str: {
    "cape-town-city-centre": {
      studio: { rate: 886, occ: 73 },
      "1": { rate: 1071, occ: 73 },
      "2": { rate: 1718, occ: 73 },
      "3": { rate: 2786, occ: 73 },
    },
    "de-waterkant": {
      studio: { rate: 2000, occ: 80 },
      "1": { rate: 3000, occ: 82 },
      "2": { rate: 5000, occ: 80 },
      "3": { rate: 8000, occ: 74 },
    },
    "sea-point": {
      studio: { rate: 2200, occ: 78 },
      "1": { rate: 3200, occ: 80 },
      "2": { rate: 5500, occ: 78 },
      "3": { rate: 9000, occ: 72 },
    },
    "camps-bay": {
      studio: { rate: 3200, occ: 72 },
      "1": { rate: 4500, occ: 74 },
      "2": { rate: 7500, occ: 76 },
      "3": { rate: 14000, occ: 70 },
    },
    "green-point": {
      studio: { rate: 1800, occ: 76 },
      "1": { rate: 2800, occ: 78 },
      "2": { rate: 4500, occ: 76 },
      "3": { rate: 7500, occ: 70 },
    },
    waterfront: {
      studio: { rate: 2500, occ: 82 },
      "1": { rate: 3800, occ: 84 },
      "2": { rate: 6500, occ: 82 },
      "3": { rate: 11000, occ: 76 },
    },
    gardens: {
      studio: { rate: 1425, occ: 74 },
      "1": { rate: 2280, occ: 76 },
      "2": { rate: 3610, occ: 74 },
      "3": { rate: 6175, occ: 68 },
    },
    woodstock: {
      studio: { rate: 1125, occ: 72 },
      "1": { rate: 1800, occ: 74 },
      "2": { rate: 2850, occ: 72 },
      "3": { rate: 4875, occ: 66 },
    },
  },
  ltr: {
    "cape-town-city-centre": { studio: 9000, "1": 14000, "2": 22000, "3": 32000 },
    "de-waterkant": { studio: 11000, "1": 17000, "2": 28000, "3": 40000 },
    "sea-point": { studio: 10000, "1": 15500, "2": 26000, "3": 38000 },
    "camps-bay": { studio: 14000, "1": 22000, "2": 38000, "3": 60000 },
    "green-point": { studio: 9500, "1": 15000, "2": 24000, "3": 36000 },
    waterfront: { studio: 13000, "1": 20000, "2": 35000, "3": 55000 },
    gardens: { studio: 8550, "1": 13300, "2": 20900, "3": 30400 },
    woodstock: { studio: 6750, "1": 10500, "2": 16500, "3": 24000 },
  },
};

/** Derived STR figures from nightly rate + occupancy (matches investment.ts assumptions). */
export function strDerivedFromRates(nightlyRate: number, occupancyPct: number) {
  const grossAnnual = nightlyRate * (occupancyPct / 100) * 365;
  const netAfterManagement = grossAnnual * 0.8;
  return {
    grossAnnual: Math.round(grossAnnual),
    netAfterManagement: Math.round(netAfterManagement),
    peakRate: Math.round(nightlyRate * 1.6),
    lowRate: Math.round(nightlyRate * 0.7),
  };
}

export function defaultMarketRateRows(): MarketRateRow[] {
  return SUBURBS.flatMap(({ value: suburb }) =>
    BEDROOM_KEYS.map((bedroomKey) => ({
      suburb,
      bedroomKey,
      strNightlyRate: DEFAULT_MARKET_RATES.str[suburb][bedroomKey].rate,
      strOccupancyPct: DEFAULT_MARKET_RATES.str[suburb][bedroomKey].occ,
      ltrMonthlyRent: DEFAULT_MARKET_RATES.ltr[suburb][bedroomKey],
    })),
  );
}

export function tablesFromRows(rows: MarketRateRow[]): MarketRatesTables {
  const str: MarketRatesTables["str"] = {};
  const ltr: MarketRatesTables["ltr"] = {};

  for (const row of rows.filter(
    (r) => BEDROOM_KEYS.includes(r.bedroomKey as BedroomKey) && SUBURBS.some((s) => s.value === r.suburb),
  )) {
    if (!str[row.suburb]) str[row.suburb] = {};
    if (!ltr[row.suburb]) ltr[row.suburb] = {};
    str[row.suburb][row.bedroomKey] = {
      rate: row.strNightlyRate,
      occ: row.strOccupancyPct,
    };
    ltr[row.suburb][row.bedroomKey] = row.ltrMonthlyRent;
  }

  return { str, ltr };
}

export function rowsFromTables(tables: MarketRatesTables): MarketRateRow[] {
  return SUBURBS.flatMap(({ value: suburb }) =>
    BEDROOM_KEYS.map((bedroomKey) => ({
      suburb,
      bedroomKey,
      strNightlyRate: tables.str[suburb]?.[bedroomKey]?.rate ?? DEFAULT_MARKET_RATES.str[suburb][bedroomKey].rate,
      strOccupancyPct: tables.str[suburb]?.[bedroomKey]?.occ ?? DEFAULT_MARKET_RATES.str[suburb][bedroomKey].occ,
      ltrMonthlyRent: tables.ltr[suburb]?.[bedroomKey] ?? DEFAULT_MARKET_RATES.ltr[suburb][bedroomKey],
    })),
  );
}

interface DbMarketRateRow {
  suburb: string;
  bedroom_key: string;
  str_nightly_rate: number;
  str_occupancy_pct: number;
  ltr_monthly_rent: number;
}

function dbRowToMarketRate(row: DbMarketRateRow): MarketRateRow | null {
  if (!BEDROOM_KEYS.includes(row.bedroom_key as BedroomKey)) return null;
  if (!SUBURBS.some((s) => s.value === row.suburb)) return null;

  return {
    suburb: row.suburb,
    bedroomKey: row.bedroom_key as BedroomKey,
    strNightlyRate: Number(row.str_nightly_rate),
    strOccupancyPct: Number(row.str_occupancy_pct),
    ltrMonthlyRent: Number(row.ltr_monthly_rent),
  };
}

export async function getMarketRates(): Promise<MarketRatesTables> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return DEFAULT_MARKET_RATES;

  const { data, error } = await supabase.from("market_rates").select("*");

  if (error || !data?.length) return DEFAULT_MARKET_RATES;

  const rows = data
    .map((row) => dbRowToMarketRate(row as DbMarketRateRow))
    .filter((row): row is MarketRateRow => row !== null);

  if (rows.length === 0) return DEFAULT_MARKET_RATES;

  const tables = tablesFromRows(rows);

  for (const { value: suburb } of SUBURBS) {
    if (!tables.str[suburb]) tables.str[suburb] = { ...DEFAULT_MARKET_RATES.str[suburb] };
    if (!tables.ltr[suburb]) tables.ltr[suburb] = { ...DEFAULT_MARKET_RATES.ltr[suburb] };
    for (const bedroomKey of BEDROOM_KEYS) {
      if (!tables.str[suburb][bedroomKey]) {
        tables.str[suburb][bedroomKey] = DEFAULT_MARKET_RATES.str[suburb][bedroomKey];
      }
      if (tables.ltr[suburb][bedroomKey] == null) {
        tables.ltr[suburb][bedroomKey] = DEFAULT_MARKET_RATES.ltr[suburb][bedroomKey];
      }
    }
  }

  return tables;
}

export async function getMarketRateRows(): Promise<MarketRateRow[]> {
  const tables = await getMarketRates();
  return rowsFromTables(tables);
}

export async function setMarketRates(rows: MarketRateRow[]): Promise<MarketRatesTables> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) throw new Error("Supabase is not configured.");

  const payload = rows.map((row) => ({
    suburb: row.suburb,
    bedroom_key: row.bedroomKey,
    str_nightly_rate: Math.round(row.strNightlyRate),
    str_occupancy_pct: row.strOccupancyPct,
    ltr_monthly_rent: Math.round(row.ltrMonthlyRent),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("market_rates").upsert(payload, {
    onConflict: "suburb,bedroom_key",
  });

  if (error) throw new Error(error.message);

  return tablesFromRows(rows);
}

export function bedroomKeyLabel(key: BedroomKey): string {
  if (key === "studio") return "Studio";
  return `${key} Bed`;
}
