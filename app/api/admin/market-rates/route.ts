import { NextRequest, NextResponse } from "next/server";
import {
  BEDROOM_KEYS,
  SUBURBS,
  getMarketRateRows,
  rowsFromTables,
  setMarketRates,
  type MarketRateRow,
} from "../../../../lib/market-rates";

export async function GET() {
  try {
    const rates = await getMarketRateRows();
    return NextResponse.json({ success: true, rates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load market rates.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function parseRateRow(raw: unknown): MarketRateRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const suburb = typeof row.suburb === "string" ? row.suburb : "";
  const bedroomKey = typeof row.bedroomKey === "string" ? row.bedroomKey : "";
  const strNightlyRate = Number(row.strNightlyRate);
  const strOccupancyPct = Number(row.strOccupancyPct);
  const ltrMonthlyRent = Number(row.ltrMonthlyRent);

  if (!SUBURBS.some((s) => s.value === suburb)) return null;
  if (!BEDROOM_KEYS.includes(bedroomKey as (typeof BEDROOM_KEYS)[number])) return null;
  if (!Number.isFinite(strNightlyRate) || strNightlyRate <= 0) return null;
  if (!Number.isFinite(strOccupancyPct) || strOccupancyPct < 0 || strOccupancyPct > 100) return null;
  if (!Number.isFinite(ltrMonthlyRent) || ltrMonthlyRent <= 0) return null;

  return {
    suburb,
    bedroomKey: bedroomKey as MarketRateRow["bedroomKey"],
    strNightlyRate,
    strOccupancyPct,
    ltrMonthlyRent,
  };
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const rawRates = Array.isArray(body.rates) ? body.rates : [];
    const rates = rawRates
      .map(parseRateRow)
      .filter((row: MarketRateRow | null): row is MarketRateRow => row !== null);

    if (rates.length !== SUBURBS.length * BEDROOM_KEYS.length) {
      return NextResponse.json(
        { success: false, error: "Invalid market rates payload. All suburb and bedroom combinations are required." },
        { status: 400 },
      );
    }

    const tables = await setMarketRates(rates);
    return NextResponse.json({ success: true, rates: rowsFromTables(tables) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save market rates.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
