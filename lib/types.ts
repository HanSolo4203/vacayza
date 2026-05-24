export type RsaConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "FALLBACK";

export interface StrData {
  nightlyRate: number;
  peakRate: number;
  lowRate: number;
  occupancyPct: number;
  grossAnnual: number;
  netAfterManagement: number;
  annualLevies: number;
  annualRatesAndTaxes: number;
  maintenanceReserve: number;
  maintenanceReservePct: number;
  netAnnual: number;
  netMonthly: number;
  yield: number;
  /** Portfolio-derived benchmark metadata (Right Stay Africa / Uplisting). */
  dataSourceLabel?: string;
  rsaConfidence?: RsaConfidenceLevel;
  rsaSampleSize?: number;
  rsaSuburbDisplay?: string;
  seasonalIndex?: Record<string, number>;
}

export interface LtrData {
  monthlyRent: number;
  annualRent: number;
  annualLevies: number;
  annualRatesAndTaxes: number;
  maintenanceReserve: number;
  maintenanceReservePct: number;
  netAnnual: number;
  netMonthly: number;
  yield: number;
}

export type Recommendation = "STR" | "LTR" | "STR-Preferred";

export type ListingStatus = "For Sale" | "Under Offer" | "On Offer" | "Sold";

export interface PropertyListingData {
  sourceUrl: string;
  title: string;
  address: string;
  suburb: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  size: number;
  propertyType: string;
  description: string;
  images: string[];
  features: string[];
  listingStatus?: ListingStatus;
  listingNumber?: string;
  listingDate?: string;
  levies?: number;
  ratesAndTaxes?: number;
  pricePerSqm?: number;
  noTransferDuty?: boolean;
  transferDuty: number;
  totalAcquisitionCost: number;
  str: StrData;
  ltr: LtrData;
  recommendation: Recommendation;
}

export interface PublishPropertyPayload extends PropertyListingData {
  agentNotes?: string;
  vacayzaScore?: number;
}
