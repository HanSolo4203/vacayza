import { calculateInvestmentMetrics, type InvestmentMetricsOptions } from "./investment";
import { getMaintenanceReservePct } from "./app-settings";
import { getMarketRates } from "./market-rates";
import { resolveRsaProjectionForListing } from "./rsa-benchmarks";
import type { PropertyListingData } from "./types";

export type InvestmentListingInput = Pick<
  PropertyListingData,
  "price" | "bedrooms" | "suburb" | "levies" | "ratesAndTaxes" | "title" | "address" | "description"
> & { rsaPropertyId?: string };

export async function calculateInvestmentMetricsWithSettings(
  input: InvestmentListingInput,
  overrides?: InvestmentMetricsOptions,
) {
  const [maintenanceReservePct, marketRates, rsaProjection] = await Promise.all([
    overrides?.maintenanceReservePct ?? getMaintenanceReservePct(),
    overrides?.marketRates ?? getMarketRates(),
    overrides?.rsaProjection !== undefined
      ? Promise.resolve(overrides.rsaProjection)
      : resolveRsaProjectionForListing(input),
  ]);
  return calculateInvestmentMetrics(input, {
    maintenanceReservePct,
    marketRates,
    rsaProjection,
  });
}
