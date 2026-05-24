/** Patterns typical of Property24 titles, not postal addresses. */
const LISTING_TITLE_PATTERNS = [
  /for\s+sale/i,
  /to\s+let/i,
  /bedroom/i,
  /\bapt\b/i,
  /apartment/i,
  /\bflat\b/i,
  /house\s+for/i,
  /property\s+for/i,
  /commercial\s+property/i,
  /vacant\s+land/i,
  /penthouse\s+for/i,
  /studio\s+for/i,
];

const STREET_HINT =
  /\b(street|st\.?|road|rd\.?|avenue|ave\.?|drive|dr\.?|lane|ln\.?|way|boulevard|blvd|place|close|crescent|circle|square|plein|walk|quay|mews|terrace)\b/i;

/**
 * True when the string looks like a mappable street address (not a listing headline).
 */
export function isLikelyStreetAddress(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 4) return false;
  if (LISTING_TITLE_PATTERNS.some((p) => p.test(trimmed))) return false;
  const hasNumber = /\d/.test(trimmed);
  const hasStreetWord = STREET_HINT.test(trimmed);
  return hasNumber || hasStreetWord;
}

/**
 * Prefer a real street address; strip listing titles and "Property in Suburb" fragments.
 */
export function sanitizeMapAddress(address: string, title?: string): string {
  const trimmed = address.trim();
  if (isLikelyStreetAddress(trimmed)) return trimmed;

  if (title?.includes(" in ")) {
    const fromTitle = title.split(" in ").slice(1).join(" in ").trim();
    if (isLikelyStreetAddress(fromTitle)) return fromTitle;
  }

  return "";
}

/** Query string appended when geocoding via Mapbox (Cape Town listings). */
export function mapGeocodeQuery(streetAddress: string): string {
  return `${streetAddress.trim()}, Cape Town, South Africa`;
}

/** Open the pin in Mapbox (coordinates) or search by street address. */
export function mapboxLocationUrl(
  streetAddress: string,
  coords?: { lat: number; lng: number } | null,
): string {
  if (coords) {
    const { lat, lng } = coords;
    return `https://www.mapbox.com/maps?lng=${lng}&lat=${lat}&zoom=16`;
  }
  const q = encodeURIComponent(mapGeocodeQuery(streetAddress));
  return `https://www.mapbox.com/search/${q}`;
}
