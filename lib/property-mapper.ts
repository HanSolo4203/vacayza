import type { PropertyRecord } from "./property-db";
import type { PropertyListingData } from "./types";

export function recordToListingData(record: PropertyRecord): PropertyListingData {
  return {
    sourceUrl: record.source_url,
    title: record.title ?? "",
    address: record.address ?? "",
    suburb: record.suburb ?? "cape-town-city-centre",
    price: record.price ?? 0,
    bedrooms: record.bedrooms ?? 0,
    bathrooms: record.bathrooms ?? 0,
    parking: record.parking ?? 0,
    size: record.size_sqm ?? 0,
    propertyType: record.property_type ?? "",
    description: record.description ?? "",
    images: record.images ?? [],
    features: record.features ?? [],
    transferDuty: record.transfer_duty ?? 0,
    totalAcquisitionCost: record.total_acquisition_cost ?? 0,
    str: record.str_data ?? {
      nightlyRate: 0,
      peakRate: 0,
      lowRate: 0,
      occupancyPct: 0,
      grossAnnual: 0,
      netAfterManagement: 0,
      annualLevies: 0,
      annualRatesAndTaxes: 0,
      maintenanceReserve: 0,
      maintenanceReservePct: 5,
      netAnnual: 0,
      netMonthly: 0,
      yield: 0,
    },
    ltr: record.ltr_data ?? {
      monthlyRent: 0,
      annualRent: 0,
      annualLevies: 0,
      annualRatesAndTaxes: 0,
      maintenanceReserve: 0,
      maintenanceReservePct: 5,
      netAnnual: 0,
      netMonthly: 0,
      yield: 0,
    },
    recommendation: record.recommendation ?? "LTR",
    listingStatus: (record.listing_status as PropertyListingData["listingStatus"]) ?? "For Sale",
    levies: record.levies ?? undefined,
    ratesAndTaxes: record.rates_and_taxes ?? undefined,
  };
}

export function listingDataToDbRow(
  data: PropertyListingData,
  extras: {
    slug: string;
    published: boolean;
    agentNotes: string;
    vacayzaScore: number;
  },
) {
  return {
    source_url: data.sourceUrl || "",
    title: data.title,
    address: data.address,
    suburb: data.suburb,
    price: data.price,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    parking: data.parking,
    size_sqm: data.size,
    property_type: data.propertyType,
    description: data.description,
    images: data.images,
    features: data.features,
    transfer_duty: data.transferDuty,
    total_acquisition_cost: data.totalAcquisitionCost,
    str_data: data.str,
    ltr_data: data.ltr,
    recommendation: data.recommendation,
    listing_status: data.listingStatus ?? "For Sale",
    levies: data.levies ?? null,
    rates_and_taxes: data.ratesAndTaxes ?? null,
    slug: extras.slug,
    published: extras.published,
    agent_notes: extras.agentNotes,
    vacayza_score: Math.min(10, Math.max(1, extras.vacayzaScore)),
  };
}
