import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/admin-property";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("rsa_market_benchmarks").select("*").order("suburb").order("bedrooms");

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, benchmarks: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load benchmarks." },
      { status: 500 },
    );
  }
}
