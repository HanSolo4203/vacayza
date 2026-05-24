import { generateUniqueSlug, getSupabaseAdmin, revalidatePropertyPaths } from "./admin-property";
import { calculateInvestmentMetricsWithSettings } from "./investment-server";
import { listingDataToDbRow } from "./property-mapper";
import { getPropertyById, getPropertyBySourceUrl } from "./property-db";
import type { PropertyListingData } from "./types";

export interface SavePropertyOptions {
  published?: boolean;
  agentNotes?: string;
  vacayzaScore?: number;
  existingId?: string;
}

export async function savePropertyListing(
  data: PropertyListingData,
  options: SavePropertyOptions = {},
): Promise<{ id: string; slug: string }> {
  const supabase = getSupabaseAdmin();
  const metrics = await calculateInvestmentMetricsWithSettings(data);
  const listing: PropertyListingData = { ...data, ...metrics };

  let existing = options.existingId ? await getPropertyById(options.existingId) : null;
  if (!existing && listing.sourceUrl) {
    existing = await getPropertyBySourceUrl(listing.sourceUrl);
  }

  const agentNotes = options.agentNotes ?? existing?.agent_notes ?? "";
  const vacayzaScore = options.vacayzaScore ?? existing?.vacayza_score ?? 7;
  const published = options.published ?? existing?.published ?? false;

  if (existing) {
    const row = listingDataToDbRow(listing, {
      slug: existing.slug,
      published,
      agentNotes,
      vacayzaScore,
    });

    const { error } = await supabase.from("property_listings").update(row).eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    if (published) revalidatePropertyPaths(existing.slug);

    return { id: existing.id, slug: existing.slug };
  }

  const slug = await generateUniqueSlug(listing.address);
  const row = listingDataToDbRow(listing, { slug, published, agentNotes, vacayzaScore });

  const { data: inserted, error } = await supabase
    .from("property_listings")
    .insert(row)
    .select("id, slug")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Failed to insert listing.");
  }

  if (published) revalidatePropertyPaths(slug);

  return { id: inserted.id, slug: inserted.slug };
}
