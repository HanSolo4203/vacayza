/** RSA / Uplisting suburb slugs (suburb_index + portfolio mapping). */

export const RSA_SUBURBS = [
  { value: "camps-bay", label: "Camps Bay" },
  { value: "waterfront", label: "V&A Waterfront" },
  { value: "de-waterkant", label: "De Waterkant" },
  { value: "sea-point", label: "Sea Point" },
  { value: "green-point", label: "Green Point" },
  { value: "city-centre", label: "City Centre" },
  { value: "gardens", label: "Gardens" },
  { value: "woodstock", label: "Woodstock" },
] as const;

export const RSA_BEDROOM_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1 Bed" },
  { value: 2, label: "2 Bed" },
  { value: 3, label: "3 Bed" },
] as const;

const PROPERTY24_TO_RSA: Record<string, string> = {
  "cape-town-city-centre": "city-centre",
  "city-centre": "city-centre",
  "camps-bay": "camps-bay",
  waterfront: "waterfront",
  "de-waterkant": "de-waterkant",
  "sea-point": "sea-point",
  "green-point": "green-point",
  gardens: "gardens",
  woodstock: "woodstock",
};

/** Map Property24 / Vacayza suburb slug to RSA benchmark suburb. */
export function normalizeSuburbForRsa(suburb: string): string {
  const key = suburb.toLowerCase().trim();
  if (PROPERTY24_TO_RSA[key]) return PROPERTY24_TO_RSA[key];
  if (key.includes("camps")) return "camps-bay";
  if (key.includes("waterfront") || key.includes("va-waterfront")) return "waterfront";
  if (key.includes("waterkant")) return "de-waterkant";
  if (key.includes("sea-point") || key.includes("seapoint")) return "sea-point";
  if (key.includes("green-point") || key.includes("greenpoint")) return "green-point";
  if (key.includes("woodstock")) return "woodstock";
  if (key.includes("gardens")) return "gardens";
  if (key.includes("city-centre") || key.includes("city-centre") || key.includes("cbd")) {
    return "city-centre";
  }
  return "city-centre";
}

export function rsaSuburbLabel(suburb: string): string {
  return RSA_SUBURBS.find((s) => s.value === suburb)?.label ?? suburb;
}

export function rsaBedroomLabel(bedrooms: number): string {
  return RSA_BEDROOM_OPTIONS.find((b) => b.value === bedrooms)?.label ?? `${bedrooms} Bed`;
}
