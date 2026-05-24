import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, revalidatePropertyPaths } from "../../../../../lib/admin-property";
import { savePropertyListing } from "../../../../../lib/save-property-listing";
import { recordToListingData } from "../../../../../lib/property-mapper";
import { getPropertyById } from "../../../../../lib/property-db";
import type { PropertyListingData } from "../../../../../lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const record = await getPropertyById(id);
    if (!record) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      property: record,
      data: recordToListingData(record),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load property.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getPropertyById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const body = await request.json();
    const data = body.data as PropertyListingData | undefined;
    const agentNotes = typeof body.agentNotes === "string" ? body.agentNotes : existing.agent_notes ?? "";
    const vacayzaScore = Number(body.vacayzaScore) || existing.vacayza_score || 7;
    const published = body.published === true;

    if (!data?.address || !data?.price) {
      return NextResponse.json({ success: false, error: "Missing property data." }, { status: 400 });
    }

    const { slug } = await savePropertyListing(data, {
      existingId: id,
      published,
      agentNotes,
      vacayzaScore,
    });

    return NextResponse.json({ success: true, id, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update listing.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const existing = await getPropertyById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const { error } = await supabase.from("property_listings").delete().eq("id", id);

    if (error) {
      console.error("[admin/properties DELETE]", error.message, error.code, error.details);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    revalidatePropertyPaths(existing.slug);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete listing.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
