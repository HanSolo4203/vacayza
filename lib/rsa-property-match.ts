import { createSupabaseClientSafe } from "./supabase";
import { normalizeSuburbForRsa } from "./rsa-suburbs";

export interface RsaListingMatchInput {
  title?: string;
  address?: string;
  description?: string;
  suburb?: string;
  bedrooms?: number;
  /** Explicit Uplisting property ID override (admin / API). */
  rsaPropertyId?: string;
}

export function listingSearchBlob(input: RsaListingMatchInput): string {
  return [input.title, input.address, input.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** True when every significant token from the RSA display name appears in the listing text. */
export function displayNameMatchesBlob(displayName: string, blob: string): boolean {
  const name = displayName.toLowerCase().trim();
  if (!name || !blob) return false;
  if (name.length >= 5 && blob.includes(name)) return true;

  const tokens = name.split(/\s+/).filter((w) => w.length >= 3 || /^\d+$/.test(w));
  if (tokens.length === 0) return false;
  return tokens.every((token) => blob.includes(token));
}

/** Known Property24 ↔ Uplisting pairings (building names not always in the listing title). */
const KNOWN_PROPERTY_IDS: Array<{ pattern: RegExp; uplistingPropertyId: string }> = [
  { pattern: /\b16\s+on\s+bree\b/i, uplistingPropertyId: "233257" },
];

function knownPropertyMatch(blob: string): string | null {
  for (const { pattern, uplistingPropertyId } of KNOWN_PROPERTY_IDS) {
    if (pattern.test(blob)) return uplistingPropertyId;
  }
  return null;
}

/**
 * Match a Vacayza / Property24 listing to an RSA Uplisting property ID using
 * description keywords and the rsa_properties registry.
 */
export async function matchRsaPropertyId(input: RsaListingMatchInput): Promise<string | null> {
  if (input.rsaPropertyId?.trim()) return input.rsaPropertyId.trim();

  const blob = listingSearchBlob(input);
  if (!blob) return null;

  const known = knownPropertyMatch(blob);
  if (known) return known;

  const supabase = createSupabaseClientSafe();
  if (!supabase) return null;

  const rsaSuburb = normalizeSuburbForRsa(input.suburb ?? "");
  const bedrooms = input.bedrooms ?? 1;
  const bedKey = bedrooms === 0 ? 0 : Math.min(Math.max(bedrooms, 1), 3);

  const { data: properties } = await supabase
    .from("rsa_properties")
    .select("uplisting_property_id, display_name, active")
    .eq("suburb", rsaSuburb)
    .eq("bedrooms", bedKey)
    .eq("active", true);

  for (const row of properties ?? []) {
    const name = row.display_name?.trim();
    if (!name) continue;
    if (displayNameMatchesBlob(name, blob)) {
      return row.uplisting_property_id;
    }
  }

  return null;
}
