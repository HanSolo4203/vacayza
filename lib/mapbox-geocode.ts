import { mapGeocodeQuery } from "./street-address";

const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/search/geocode/v6/forward";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export async function geocodeCapeTownAddress(address: string): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("Mapbox token is not configured.");
  }

  const query = mapGeocodeQuery(address);
  const params = new URLSearchParams({
    q: query,
    country: "ZA",
    proximity: "18.4241,-33.9249",
    access_token: token,
  });

  const res = await fetch(`${MAPBOX_GEOCODE_URL}?${params.toString()}`);
  if (!res.ok) {
    console.error("[geocode]", res.status, await res.text());
    return null;
  }

  const json = (await res.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
  };

  const coords = json.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [longitude, latitude] = coords;
  return { latitude, longitude };
}
