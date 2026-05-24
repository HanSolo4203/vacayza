/** Walking-distance context pills by suburb slug. */
export const NEARBY_BY_SUBURB: Record<string, string[]> = {
  "cape-town-city-centre": [
    "V&A Waterfront 12 min",
    "Table Mountain 18 min",
    "CTICC 5 min",
  ],
  "sea-point": ["Beach 3 min", "Green Point Park 8 min", "V&A 15 min"],
  "de-waterkant": ["Green Point Park 5 min", "Cape Quarter 2 min", "City 8 min"],
  "camps-bay": ["Clifton Beach 5 min", "Table Mountain 20 min", "City 25 min"],
  "green-point": ["Green Point Park 4 min", "V&A 10 min", "Stadium 6 min"],
  waterfront: ["V&A 2 min", "CTICC 8 min", "City Centre 10 min"],
  gardens: ["Company Gardens 5 min", "Kloof Street 8 min", "City 10 min"],
  woodstock: ["Old Biscuit Mill 8 min", "District Six 5 min", "City 12 min"],
};

export function getNearbyPills(suburb: string | null | undefined): string[] {
  if (!suburb) return NEARBY_BY_SUBURB["cape-town-city-centre"];
  return NEARBY_BY_SUBURB[suburb] ?? NEARBY_BY_SUBURB["cape-town-city-centre"];
}
