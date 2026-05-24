import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, revalidatePropertyPaths } from "../../../lib/admin-property";
import { getPropertyById } from "../../../lib/property-db";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!propertyId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { success: false, error: "propertyId, latitude, and longitude are required." },
        { status: 400 },
      );
    }

    const existing = await getPropertyById(propertyId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("property_listings")
      .update({ latitude, longitude })
      .eq("id", propertyId);

    if (error) {
      console.error("[update-property-coords]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (existing.slug) revalidatePropertyPaths(existing.slug);

    return NextResponse.json({ success: true, latitude, longitude });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update coordinates.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
