import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, revalidatePropertyPaths } from "../../../lib/admin-property";
import { geocodeCapeTownAddress } from "../../../lib/mapbox-geocode";
import { isLikelyStreetAddress } from "../../../lib/street-address";
import { getPropertyById } from "../../../lib/property-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";
    const force = body.force === true;

    if (!address || !propertyId) {
      return NextResponse.json(
        { success: false, error: "address and propertyId are required." },
        { status: 400 },
      );
    }

    if (!isLikelyStreetAddress(address)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a street address with a street number or name (e.g. 16 Bree Street), not the listing headline.",
        },
        { status: 400 },
      );
    }

    const existing = await getPropertyById(propertyId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    if (!force && existing.latitude != null && existing.longitude != null) {
      return NextResponse.json({
        success: true,
        latitude: existing.latitude,
        longitude: existing.longitude,
        cached: true,
      });
    }

    const result = await geocodeCapeTownAddress(address);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Could not geocode address." },
        { status: 422 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("property_listings")
      .update({
        latitude: result.latitude,
        longitude: result.longitude,
        address,
      })
      .eq("id", propertyId);

    if (error) {
      console.error("[geocode-property]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (existing.slug) revalidatePropertyPaths(existing.slug);

    return NextResponse.json({
      success: true,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocoding failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
