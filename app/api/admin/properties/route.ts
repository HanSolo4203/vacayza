import { NextRequest, NextResponse } from "next/server";
import { savePropertyListing } from "../../../../lib/save-property-listing";
import { getAllProperties } from "../../../../lib/property-db";
import type { PropertyListingData } from "../../../../lib/types";

export async function GET() {
  try {
    const properties = await getAllProperties();
    return NextResponse.json({ success: true, properties });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load properties.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = body.data as PropertyListingData | undefined;
    const agentNotes = typeof body.agentNotes === "string" ? body.agentNotes : "";
    const vacayzaScore = Number(body.vacayzaScore) || 7;
    const published = body.published !== false;

    if (!data?.address || !data?.price) {
      return NextResponse.json({ success: false, error: "Missing property data." }, { status: 400 });
    }

    const { id, slug } = await savePropertyListing(data, {
      published,
      agentNotes,
      vacayzaScore,
    });

    return NextResponse.json({ success: true, id, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save listing.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
