import { NextRequest, NextResponse } from "next/server";
import { generateUniqueSlug, getSupabaseAdmin, revalidatePropertyPaths } from "../../../lib/admin-property";
import { calculateInvestmentMetricsWithSettings } from "../../../lib/investment-server";
import { listingDataToDbRow } from "../../../lib/property-mapper";
import type { PublishPropertyPayload } from "../../../lib/types";

/** @deprecated Prefer POST /api/admin/properties */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const data = body.data as PublishPropertyPayload | undefined;
    const agentNotes = typeof body.agentNotes === "string" ? body.agentNotes : "";
    const vacayzaScore = Number(body.vacayzaScore) || 7;

    if (!data?.address || !data?.price) {
      return NextResponse.json({ success: false, error: "Missing property data." }, { status: 400 });
    }

    const metrics = await calculateInvestmentMetricsWithSettings(data);
    const listing = { ...data, ...metrics };
    const slug = await generateUniqueSlug(listing.address);
    const row = listingDataToDbRow(listing, { slug, published: true, agentNotes, vacayzaScore });

    const { error } = await supabase.from("property_listings").insert(row);

    if (error) {
      console.error("[publish-property]", error.message, error.code, error.details);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    revalidatePropertyPaths(slug);
    return NextResponse.json({ success: true, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish listing.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
