import { DEFAULT_MAINTENANCE_RESERVE_PCT } from "./app-settings";
import { DEFAULT_MARKET_RATES, SUBURBS, type MarketRatesTables } from "./market-rates";
import { rsaProjectionToNightlyMetrics, strDataSourceLabel, type RsaStrProjection } from "./rsa-benchmarks";
import type { LtrData, PropertyListingData, Recommendation, StrData } from "./types";

/** @deprecated Use DEFAULT_MARKET_RATES.str — kept for backwards compatibility */
export const strTable = DEFAULT_MARKET_RATES.str;

/** @deprecated Use DEFAULT_MARKET_RATES.ltr — kept for backwards compatibility */
export const ltrTable = DEFAULT_MARKET_RATES.ltr;

const DEFAULT_STR = { rate: 2000, occ: 72 };
const DEFAULT_LTR = 12000;

export function calculateTransferDuty(price: number): number {
  if (price <= 1_100_000) return 0;
  if (price <= 1_512_500) return (price - 1_100_000) * 0.03;
  if (price <= 2_117_500) return 12_375 + (price - 1_512_500) * 0.06;
  if (price <= 2_722_500) return 48_675 + (price - 2_117_500) * 0.08;
  if (price <= 12_100_000) return 97_075 + (price - 2_722_500) * 0.11;
  return 1_128_600 + (price - 12_100_000) * 0.13;
}

function bedroomKey(bedrooms: number): string {
  return bedrooms === 0 ? "studio" : String(Math.min(bedrooms, 3));
}

export function annualizeHoldingCosts(levies?: number, ratesAndTaxes?: number) {
  return {
    annualLevies: (levies ?? 0) * 12,
    annualRatesAndTaxes: (ratesAndTaxes ?? 0) * 12,
  };
}

export function applyNetDeductions(
  incomeBeforeDeductions: number,
  price: number,
  levies?: number,
  ratesAndTaxes?: number,
  maintenanceReservePct = DEFAULT_MAINTENANCE_RESERVE_PCT,
) {
  const { annualLevies, annualRatesAndTaxes } = annualizeHoldingCosts(levies, ratesAndTaxes);
  const maintenanceReserve = incomeBeforeDeductions * (maintenanceReservePct / 100);
  const netAnnual = incomeBeforeDeductions - annualLevies - annualRatesAndTaxes - maintenanceReserve;
  const netMonthly = netAnnual / 12;
  const yieldPct = price > 0 ? (netAnnual / price) * 100 : 0;

  return {
    annualLevies,
    annualRatesAndTaxes,
    maintenanceReserve,
    maintenanceReservePct,
    netAnnual,
    netMonthly,
    yield: yieldPct,
  };
}

export interface InvestmentMetricsOptions {
  maintenanceReservePct?: number;
  marketRates?: MarketRatesTables;
  rsaProjection?: RsaStrProjection | null;
}

function resolveMarketRates(options?: InvestmentMetricsOptions): MarketRatesTables {
  return options?.marketRates ?? DEFAULT_MARKET_RATES;
}

export function calculateStrMetrics(
  price: number,
  bedrooms: number,
  suburb: string,
  levies?: number,
  ratesAndTaxes?: number,
  options?: InvestmentMetricsOptions,
): StrData {
  const rsa = options?.rsaProjection;
  if (rsa) {
    const { nightlyRate, occupancyPct, grossAnnual, netAfterManagement } =
      rsaProjectionToNightlyMetrics(rsa);
    const seasonal = rsa.seasonalIndex;
    const peakMultiplier = seasonal
      ? Math.max(...Object.values(seasonal).filter((v) => v > 0), 1)
      : 1.6;
    const lowMultiplier = seasonal
      ? Math.min(...Object.values(seasonal).filter((v) => v > 0), 1)
      : 0.7;
    const deductions = applyNetDeductions(
      netAfterManagement,
      price,
      levies,
      ratesAndTaxes,
      options?.maintenanceReservePct,
    );

    return {
      nightlyRate,
      peakRate: Math.round(nightlyRate * peakMultiplier),
      lowRate: Math.round(nightlyRate * lowMultiplier),
      occupancyPct,
      grossAnnual,
      netAfterManagement,
      ...deductions,
      dataSourceLabel: strDataSourceLabel(rsa),
      rsaConfidence: rsa.confidence,
      rsaSampleSize: rsa.sampleSize,
      rsaSuburbDisplay: rsa.suburbDisplay,
      seasonalIndex: rsa.seasonalIndex,
    };
  }

  const key = bedroomKey(bedrooms);
  const tables = resolveMarketRates(options);
  const { rate, occ } = tables.str[suburb]?.[key] ?? DEFAULT_STR;
  const grossAnnual = rate * (occ / 100) * 365;
  const netAfterManagement = grossAnnual * 0.8;
  const deductions = applyNetDeductions(
    netAfterManagement,
    price,
    levies,
    ratesAndTaxes,
    options?.maintenanceReservePct,
  );

  return {
    nightlyRate: rate,
    peakRate: rate * 1.6,
    lowRate: rate * 0.7,
    occupancyPct: occ,
    grossAnnual,
    netAfterManagement,
    ...deductions,
  };
}

export function calculateLtrMetrics(
  price: number,
  bedrooms: number,
  suburb: string,
  levies?: number,
  ratesAndTaxes?: number,
  options?: InvestmentMetricsOptions,
): LtrData {
  const key = bedroomKey(bedrooms);
  const tables = resolveMarketRates(options);
  const monthlyRent = tables.ltr[suburb]?.[key] ?? DEFAULT_LTR;
  const annualRent = monthlyRent * 11.5;
  const deductions = applyNetDeductions(
    annualRent,
    price,
    levies,
    ratesAndTaxes,
    options?.maintenanceReservePct,
  );

  return {
    monthlyRent,
    annualRent,
    ...deductions,
  };
}

export function getRecommendation(strYield: number, ltrYield: number): Recommendation {
  if (strYield > ltrYield + 2) return "STR-Preferred";
  if (strYield > ltrYield) return "STR";
  return "LTR";
}

export function calculateInvestmentMetrics(
  input: Pick<PropertyListingData, "price" | "bedrooms" | "suburb" | "levies" | "ratesAndTaxes">,
  options?: InvestmentMetricsOptions,
): Pick<PropertyListingData, "transferDuty" | "totalAcquisitionCost" | "str" | "ltr" | "recommendation"> {
  const transferDuty = calculateTransferDuty(input.price);
  const totalAcquisitionCost = input.price + transferDuty;
  const str = calculateStrMetrics(
    input.price,
    input.bedrooms,
    input.suburb,
    input.levies,
    input.ratesAndTaxes,
    options,
  );
  const ltr = calculateLtrMetrics(
    input.price,
    input.bedrooms,
    input.suburb,
    input.levies,
    input.ratesAndTaxes,
    options,
  );
  const recommendation = getRecommendation(str.yield, ltr.yield);

  return {
    transferDuty,
    totalAcquisitionCost,
    str,
    ltr,
    recommendation,
  };
}

export function extractSuburbFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const forSaleIdx = segments.indexOf("for-sale");
    if (forSaleIdx >= 0 && segments[forSaleIdx + 1]) {
      return segments[forSaleIdx + 1].toLowerCase();
    }
    const suburbSegment = segments.find((s) =>
      SUBURBS.some((known) => s.toLowerCase().includes(known.value.replace(/-/g, "")) || s === known.value),
    );
    if (suburbSegment) return suburbSegment.toLowerCase();
  } catch {
    // fall through
  }
  return "cape-town-city-centre";
}

export function inferPropertyType(title: string, bedrooms: number): string {
  const lower = title.toLowerCase();
  if (lower.includes("studio")) return "Studio";
  if (lower.includes("apartment") || lower.includes("flat") || lower.includes("penthouse")) return "Apartment";
  if (lower.includes("house") || lower.includes("villa") || lower.includes("townhouse")) return "House";
  if (bedrooms === 0) return "Studio";
  if (bedrooms <= 2) return "Apartment";
  return "House";
}

export function parsePrice(text: string): number {
  const zarMatch = text.match(/R\s*([\d\s,]+)/i);
  if (zarMatch) {
    const amount = parseInt(zarMatch[1].replace(/[\s,]/g, ""), 10);
    if (amount > 0) return amount;
  }

  const cleaned = text.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}
