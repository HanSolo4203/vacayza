import { format, parseISO } from "date-fns";
import Papa from "papaparse";

export interface CalendarRow {
  listing_id: string;
  date: string;
  available: boolean;
  price: number | null;
}

export interface MonthlyOccupancy {
  month: number;
  bookedNights: number;
  totalNights: number;
  occupancyPct: number;
  medianBookedPrice: number | null;
}

export interface CalendarOccupancyAnalysis {
  listingCount: number;
  dateFrom: string | null;
  dateTo: string | null;
  totalBookedNights: number;
  totalNights: number;
  overallOccupancyPct: number;
  monthly: MonthlyOccupancy[];
  /** Month 1–12 → index vs average occupancy (1.0 = average). */
  seasonalIndex: Record<string, number>;
}

function normalizeHeaderKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCsvRow(raw: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[normalizeHeaderKey(key)] = String(value ?? "").trim();
  }
  return normalized;
}

function parseAvailable(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v === "t" || v === "true" || v === "1" || v === "yes" || v === "y") return true;
  if (v === "f" || v === "false" || v === "0" || v === "no" || v === "n") return false;
  return true;
}

function parsePrice(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseCalendarDate(value: string): Date {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return parseISO(trimmed.slice(0, 10));
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid calendar date: ${value}`);
  return d;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}

export function calendarRowsFromCsv(csvText: string): CalendarRow[] {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(`Calendar CSV parse error${first?.row != null ? ` at row ${first.row}` : ""}: ${first?.message ?? "unknown"}`);
  }

  const rows: CalendarRow[] = [];

  for (const raw of parsed.data) {
    const row = normalizeCsvRow(raw);
    const listingId = row.listing_id || row.id;
    const date = row.date || row.calendar_date;
    if (!listingId || !date) continue;

    rows.push({
      listing_id: listingId,
      date,
      available: parseAvailable(row.available ?? "t"),
      price: parsePrice(row.price),
    });
  }

  return rows;
}

/** Group by calendar month; booked nights = available=false. */
export function analyzeCalendarOccupancy(rows: CalendarRow[]): CalendarOccupancyAnalysis {
  const listingIds = new Set<string>();
  const bookedByMonth: Record<number, number> = {};
  const totalByMonth: Record<number, number> = {};
  const bookedPricesByMonth: Record<number, number[]> = {};
  const dates: Date[] = [];

  for (let m = 1; m <= 12; m++) {
    bookedByMonth[m] = 0;
    totalByMonth[m] = 0;
    bookedPricesByMonth[m] = [];
  }

  for (const row of rows) {
    listingIds.add(row.listing_id);
    const date = parseCalendarDate(row.date);
    dates.push(date);
    const month = date.getMonth() + 1;

    totalByMonth[month] = (totalByMonth[month] ?? 0) + 1;
    if (!row.available) {
      bookedByMonth[month] = (bookedByMonth[month] ?? 0) + 1;
      if (row.price != null) bookedPricesByMonth[month]!.push(row.price);
    }
  }

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const totalBookedNights = Object.values(bookedByMonth).reduce((a, b) => a + b, 0);
  const totalNights = Object.values(totalByMonth).reduce((a, b) => a + b, 0);

  const monthly: MonthlyOccupancy[] = [];
  const occupancyByMonth: Record<number, number> = {};

  for (let m = 1; m <= 12; m++) {
    const booked = bookedByMonth[m] ?? 0;
    const total = totalByMonth[m] ?? 0;
    const occupancyPct = total > 0 ? Math.round((booked / total) * 1000) / 10 : 0;
    occupancyByMonth[m] = occupancyPct;

    monthly.push({
      month: m,
      bookedNights: booked,
      totalNights: total,
      occupancyPct,
      medianBookedPrice: median(bookedPricesByMonth[m] ?? []),
    });
  }

  const activeMonths = monthly.filter((m) => m.totalNights > 0);
  const avgOccupancy =
    activeMonths.length > 0
      ? activeMonths.reduce((sum, m) => sum + m.occupancyPct, 0) / activeMonths.length
      : 0;

  const seasonalIndex: Record<string, number> = {};
  for (let m = 1; m <= 12; m++) {
    const occ = occupancyByMonth[m] ?? 0;
    seasonalIndex[String(m)] =
      avgOccupancy > 0 && occ > 0 ? Math.round((occ / avgOccupancy) * 100) / 100 : 1;
  }

  return {
    listingCount: listingIds.size,
    dateFrom: sortedDates[0] ? format(sortedDates[0], "yyyy-MM-dd") : null,
    dateTo: sortedDates[sortedDates.length - 1]
      ? format(sortedDates[sortedDates.length - 1]!, "yyyy-MM-dd")
      : null,
    totalBookedNights,
    totalNights,
    overallOccupancyPct:
      totalNights > 0 ? Math.round((totalBookedNights / totalNights) * 1000) / 10 : 0,
    monthly: monthly.filter((m) => m.totalNights > 0),
    seasonalIndex,
  };
}

export function analyzeCalendarCsv(csvText: string): CalendarOccupancyAnalysis {
  return analyzeCalendarOccupancy(calendarRowsFromCsv(csvText));
}
