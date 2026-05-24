import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/admin-property";
import {
  calculateBenchmarks,
  calculatePropertyStats,
  fillBenchmarkGaps,
  propertyMapFromRows,
  type BookingRow,
  type RsaPropertyMapping,
} from "../../../lib/uplisting-parser";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookings = (Array.isArray(body.bookings) ? body.bookings : []) as BookingRow[];
    const properties = (Array.isArray(body.properties) ? body.properties : []) as RsaPropertyMapping[];
    const persist = body.persist === true;

    if (bookings.length === 0) {
      return NextResponse.json({ success: false, error: "No bookings provided." }, { status: 400 });
    }

    const propertyMap = propertyMapFromRows(properties);
    const propertyStats = calculatePropertyStats(bookings, propertyMap);
    const rawBenchmarks = calculateBenchmarks(propertyStats);

    const supabase = getSupabaseAdmin();
    const { data: indexRows } = await supabase.from("suburb_index").select("*");
    const suburbIndex = (indexRows ?? []).map((row) => ({
      suburb: row.suburb,
      suburb_display: row.suburb_display,
      adr_index: Number(row.adr_index) || 1,
    }));

    const benchmarks = fillBenchmarkGaps(rawBenchmarks, suburbIndex);

    if (persist) {
      for (const stat of propertyStats) {
        await supabase.from("rsa_property_stats").insert({
          uplisting_property_id: stat.uplisting_property_id,
          data_from: stat.data_from,
          data_to: stat.data_to,
          adr: stat.adr,
          occupancy_pct: stat.occupancy_pct,
          annual_revenue_run_rate: stat.annual_revenue_run_rate,
          monthly_revenue: stat.monthly_revenue,
          channel_breakdown: stat.channel_breakdown,
          total_bookings: stat.total_bookings,
          total_nights_booked: stat.total_nights_booked,
          total_revenue: stat.total_revenue,
        });
      }

      const benchmarkPayload = benchmarks.map((b) => ({
        suburb: b.suburb,
        bedrooms: b.bedrooms,
        sample_size: b.sample_size,
        avg_adr: b.avg_adr,
        avg_occupancy_pct: b.avg_occupancy_pct,
        avg_annual_revenue: b.avg_annual_revenue,
        seasonal_index: b.seasonal_index,
        channel_mix: b.channel_mix,
        confidence_level: b.confidence_level,
        data_from: b.data_from || null,
        data_to: b.data_to || null,
        updated_at: new Date().toISOString(),
      }));

      const { error: benchError } = await supabase
        .from("rsa_market_benchmarks")
        .upsert(benchmarkPayload, { onConflict: "suburb,bedrooms" });

      if (benchError) throw new Error(benchError.message);
    }

    const portfolioBenchmarks = benchmarks.filter((b) => b.confidence_level !== "FALLBACK");
    const fallbackCount = benchmarks.length - portfolioBenchmarks.length;

    return NextResponse.json({
      success: true,
      summary: {
        bookingsProcessed: bookings.length,
        propertiesWithStats: propertyStats.length,
        benchmarksCalculated: benchmarks.length,
        portfolioDerived: portfolioBenchmarks.length,
        fallbackFilled: fallbackCount,
        persisted: persist,
      },
      propertyStats,
      benchmarks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Benchmark calculation failed.",
      },
      { status: 500 },
    );
  }
}
