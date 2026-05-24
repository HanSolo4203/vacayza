import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/admin-property";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("rsa_properties")
      .select("*")
      .order("suburb")
      .order("bedrooms");

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, properties: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load properties." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";

interface PropertyPayload {
  id?: string;
  uplisting_property_id: string;
  display_name?: string;
  suburb: string;
  suburb_display?: string;
  bedrooms: number;
  property_type?: string;
  max_guests?: number;
  active?: boolean;
}

function buildPropertyRows(properties: PropertyPayload[]) {
  return properties
    .filter((p) => p.uplisting_property_id?.trim())
    .map((p) => ({
      uplisting_property_id: p.uplisting_property_id.trim(),
      display_name: p.display_name?.trim() || null,
      suburb: p.suburb,
      suburb_display: p.suburb_display?.trim() || p.suburb,
      bedrooms: Number.isFinite(Number(p.bedrooms)) ? Number(p.bedrooms) : 1,
      property_type: p.property_type || "apartment",
      max_guests: p.max_guests != null ? Number(p.max_guests) : null,
      active: p.active !== false,
    }));
}

async function saveProperties(request: NextRequest) {
  const body = await request.json();
  const properties = Array.isArray(body.properties) ? body.properties : [];

  const payload = buildPropertyRows(properties);
  if (payload.length === 0) {
    return NextResponse.json({ success: false, error: "No valid properties to save." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("rsa_properties").upsert(payload, {
    onConflict: "uplisting_property_id",
  });

  if (error) throw new Error(error.message);

  const { data, error: selectError } = await supabase
    .from("rsa_properties")
    .select("*")
    .order("suburb")
    .order("bedrooms");

  if (selectError) throw new Error(selectError.message);

  return NextResponse.json({ success: true, properties: data ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    return await saveProperties(request);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save properties." },
      { status: 500 },
    );
  }
}

/** @deprecated Use POST — some Next dev builds return 404 for PUT on this route */
export async function PUT(request: NextRequest) {
  return POST(request);
}
