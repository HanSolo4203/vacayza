import {
  differenceInCalendarDays,
  format,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfMonth,
} from "date-fns";
import Papa from "papaparse";
import { RSA_BEDROOM_OPTIONS, RSA_SUBURBS } from "./rsa-suburbs";

export interface BookingRow {
  property_id: string;
  check_in: string;
  check_out: string;
  amount: number;
  channel: string;
}

export interface RsaPropertyMapping {
  uplisting_property_id: string;
  suburb: string;
  suburb_display: string;
  bedrooms: number;
  display_name?: string;
  property_type?: string;
  active?: boolean;
}

export interface PropertyStats {
  uplisting_property_id: string;
  suburb: string;
  bedrooms: number;
  data_from: string;
  data_to: string;
  adr: number;
  occupancy_pct: number;
  annual_revenue_run_rate: number;
  monthly_revenue: Record<string, number>;
  channel_breakdown: Record<string, number>;
  total_bookings: number;
  total_nights_booked: number;
  total_revenue: number;
}

export interface MarketBenchmark {
  suburb: string;
  bedrooms: number;
  sample_size: number;
  avg_adr: number;
  avg_occupancy_pct: number;
  avg_annual_revenue: number;
  seasonal_index: Record<string, number>;
  channel_mix: Record<string, number>;
  confidence_level: ConfidenceLevel;
  data_from: string;
  data_to: string;
}

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "FALLBACK";

export interface SuburbIndexRow {
  suburb: string;
  suburb_display: string;
  adr_index: number;
}

/** Minimal export format */
const SIMPLE_CSV_COLUMNS = ["property_id", "check_in", "check_out", "amount", "channel"] as const;

/** Uplisting owner statement export (e.g. booking_report_*_owner_statement_data_*.csv) */
export const UPLISTING_OWNER_STATEMENT_HINT =
  "Uplisting owner statement: Property ID, Check in, Check out, Total payout, Channel name";

const SKIPPED_STATUSES = new Set(["cancelled"]);

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

function parseMoney(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function firstPresent(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v) return v;
  }
  return "";
}

function parseDate(value: string): Date {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return parseISO(trimmed.slice(0, 10));
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d;
}

function daysBetween(checkIn: string, checkOut: string): number {
  const nights = differenceInCalendarDays(parseDate(checkOut), parseDate(checkIn));
  return Math.max(nights, 0);
}

function totalDaysInclusive(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from) + 1;
}

function monthKey(date: Date): string {
  return format(startOfMonth(date), "yyyy-MM");
}

/** Parse already-parsed CSV records (Uplisting export or simple 5-column format). */
export function parseBookingRows(records: Record<string, unknown>[]): BookingRow[] {
  const rows: BookingRow[] = [];

  for (const raw of records) {
    const row = normalizeCsvRow(raw);

    const status = row.status?.toLowerCase();
    if (status && SKIPPED_STATUSES.has(status)) continue;

    const property_id = firstPresent(row, ["property_id"]);
    const check_in = firstPresent(row, ["check_in", "checkin"]);
    const check_out = firstPresent(row, ["check_out", "checkout"]);

    const amount = parseMoney(
      firstPresent(row, [
        "total_payout",
        "gross_revenue",
        "net_revenue",
        "amount",
        "accommodation_total",
      ]),
    );

    const channel =
      firstPresent(row, ["channel_name", "channel", "booking_source"]) || "direct";

    if (!property_id || !check_in || !check_out || amount <= 0) continue;

    rows.push({ property_id, check_in, check_out, amount, channel });
  }

  return rows;
}

export function parseCSV(file: File): Promise<BookingRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0]?.message ?? "CSV parse failed"));
          return;
        }

        const rows = parseBookingRows(results.data);

        if (rows.length === 0) {
          reject(
            new Error(
              `No valid bookings found. Use Uplisting owner statement CSV (${UPLISTING_OWNER_STATEMENT_HINT}) or simple columns: ${SIMPLE_CSV_COLUMNS.join(", ")}.`,
            ),
          );
          return;
        }

        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}

export function getConfidenceLevel(sampleSize: number): {
  level: ConfidenceLevel;
  label: string;
} {
  if (sampleSize >= 4) return { level: "HIGH", label: "High" };
  if (sampleSize >= 2) return { level: "MEDIUM", label: "Medium" };
  if (sampleSize === 1) return { level: "LOW", label: "Low" };
  return { level: "FALLBACK", label: "Fallback" };
}

export function calculateSeasonalIndex(monthlyRevenue: Record<string, number>): Record<string, number> {
  const byCalendarMonth: Record<number, number[]> = {};
  for (let m = 1; m <= 12; m++) byCalendarMonth[m] = [];

  for (const [key, revenue] of Object.entries(monthlyRevenue)) {
    const month = parseInt(key.split("-")[1] ?? "0", 10);
    if (month >= 1 && month <= 12) byCalendarMonth[month].push(revenue);
  }

  const monthAverages: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    const vals = byCalendarMonth[m];
    monthAverages[m] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  const nonZero = Object.values(monthAverages).filter((v) => v > 0);
  const overallAvg =
    nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 1;

  const index: Record<string, number> = {};
  for (let m = 1; m <= 12; m++) {
    const avg = monthAverages[m];
    index[String(m)] = overallAvg > 0 && avg > 0 ? Math.round((avg / overallAvg) * 100) / 100 : 1;
  }
  return index;
}

function mergeChannelBreakdown(
  target: Record<string, number>,
  channel: string,
  amount: number,
) {
  const key = channel.trim() || "direct";
  target[key] = (target[key] ?? 0) + amount;
}

function channelMixFromBreakdown(breakdown: Record<string, number>): Record<string, number> {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total <= 0) return {};
  const mix: Record<string, number> = {};
  for (const [ch, rev] of Object.entries(breakdown)) {
    mix[ch] = Math.round((rev / total) * 1000) / 10;
  }
  return mix;
}

export function calculatePropertyStats(
  bookings: BookingRow[],
  propertyMap: Map<string, RsaPropertyMapping>,
): PropertyStats[] {
  const byProperty = new Map<string, BookingRow[]>();

  for (const row of bookings) {
    const mapping = propertyMap.get(row.property_id);
    if (!mapping) continue;
    const list = byProperty.get(row.property_id) ?? [];
    list.push(row);
    byProperty.set(row.property_id, list);
  }

  const stats: PropertyStats[] = [];

  for (const [propertyId, propertyBookings] of byProperty) {
    const mapping = propertyMap.get(propertyId)!;
    let totalRevenue = 0;
    let totalNights = 0;
    const monthlyRevenue: Record<string, number> = {};
    const channelBreakdown: Record<string, number> = {};
    const checkIns: Date[] = [];
    const checkOuts: Date[] = [];

    for (const b of propertyBookings) {
      const nights = daysBetween(b.check_in, b.check_out);
      if (nights <= 0) continue;

      totalRevenue += b.amount;
      totalNights += nights;
      mergeChannelBreakdown(channelBreakdown, b.channel, b.amount);

      const inDate = parseDate(b.check_in);
      const outDate = parseDate(b.check_out);
      checkIns.push(inDate);
      checkOuts.push(outDate);

      const mk = monthKey(inDate);
      monthlyRevenue[mk] = (monthlyRevenue[mk] ?? 0) + b.amount;
    }

    if (totalNights <= 0) continue;

    const dataFrom = minDate(checkIns);
    const dataTo = maxDate(checkOuts);
    const periodDays = totalDaysInclusive(dataFrom, dataTo);
    const adr = Math.round(totalRevenue / totalNights);
    const occupancyPct = Math.round((totalNights / periodDays) * 100);
    const annualRunRate = Math.round((totalRevenue / periodDays) * 365);

    stats.push({
      uplisting_property_id: propertyId,
      suburb: mapping.suburb,
      bedrooms: mapping.bedrooms,
      data_from: format(dataFrom, "yyyy-MM-dd"),
      data_to: format(dataTo, "yyyy-MM-dd"),
      adr,
      occupancy_pct: Math.min(occupancyPct, 100),
      annual_revenue_run_rate: annualRunRate,
      monthly_revenue: monthlyRevenue,
      channel_breakdown: channelBreakdown,
      total_bookings: propertyBookings.length,
      total_nights_booked: totalNights,
      total_revenue: Math.round(totalRevenue),
    });
  }

  return stats;
}

export function calculateBenchmarks(stats: PropertyStats[]): MarketBenchmark[] {
  const groups = new Map<string, PropertyStats[]>();

  for (const s of stats) {
    const key = `${s.suburb}:${s.bedrooms}`;
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }

  const benchmarks: MarketBenchmark[] = [];

  for (const [, group] of groups) {
    const sampleSize = group.length;
    const { level } = getConfidenceLevel(sampleSize);

    const avgAdr = Math.round(group.reduce((a, s) => a + s.adr, 0) / sampleSize);
    const avgOcc = Math.round(group.reduce((a, s) => a + s.occupancy_pct, 0) / sampleSize);
    const avgAnnual = Math.round(
      group.reduce((a, s) => a + s.annual_revenue_run_rate, 0) / sampleSize,
    );

    const mergedMonthly: Record<string, number> = {};
    const mergedChannel: Record<string, number> = {};
    for (const s of group) {
      for (const [k, v] of Object.entries(s.monthly_revenue)) {
        mergedMonthly[k] = (mergedMonthly[k] ?? 0) + v;
      }
      for (const [k, v] of Object.entries(s.channel_breakdown)) {
        mergedChannel[k] = (mergedChannel[k] ?? 0) + v;
      }
    }

    const dataFrom = format(minDate(group.map((s) => parseISO(s.data_from))), "yyyy-MM-dd");
    const dataTo = format(maxDate(group.map((s) => parseISO(s.data_to))), "yyyy-MM-dd");

    benchmarks.push({
      suburb: group[0].suburb,
      bedrooms: group[0].bedrooms,
      sample_size: sampleSize,
      avg_adr: avgAdr,
      avg_occupancy_pct: avgOcc,
      avg_annual_revenue: avgAnnual,
      seasonal_index: calculateSeasonalIndex(mergedMonthly),
      channel_mix: channelMixFromBreakdown(mergedChannel),
      confidence_level: level,
      data_from: dataFrom,
      data_to: dataTo,
    });
  }

  return benchmarks;
}

export function fillBenchmarkGaps(
  benchmarks: MarketBenchmark[],
  suburbIndex: SuburbIndexRow[],
): MarketBenchmark[] {
  const byKey = new Map(benchmarks.map((b) => [`${b.suburb}:${b.bedrooms}`, b]));
  const cityCentreByBed = new Map<number, MarketBenchmark>();

  for (const b of benchmarks) {
    if (b.suburb === "city-centre" && b.confidence_level !== "FALLBACK") {
      cityCentreByBed.set(b.bedrooms, b);
    }
  }

  const baseline =
    cityCentreByBed.size > 0
      ? [...cityCentreByBed.values()][0]
      : benchmarks.find((b) => b.confidence_level !== "FALLBACK");

  const indexMap = new Map(suburbIndex.map((r) => [r.suburb, Number(r.adr_index) || 1]));

  const filled = [...benchmarks];

  for (const { value: suburb } of RSA_SUBURBS) {
    for (const { value: bedrooms } of RSA_BEDROOM_OPTIONS) {
      const key = `${suburb}:${bedrooms}`;
      if (byKey.has(key)) continue;

      const cityBench = cityCentreByBed.get(bedrooms) ?? baseline;
      if (!cityBench) continue;

      const ratio = (indexMap.get(suburb) ?? 1) / (indexMap.get("city-centre") ?? 1);

      filled.push({
        suburb,
        bedrooms,
        sample_size: 0,
        avg_adr: Math.round(cityBench.avg_adr * ratio),
        avg_occupancy_pct: cityBench.avg_occupancy_pct,
        avg_annual_revenue: Math.round(cityBench.avg_annual_revenue * ratio),
        seasonal_index: cityBench.seasonal_index,
        channel_mix: cityBench.channel_mix,
        confidence_level: "FALLBACK",
        data_from: cityBench.data_from,
        data_to: cityBench.data_to,
      });
      byKey.set(key, filled[filled.length - 1]);
    }
  }

  return filled;
}

export function bookingDateRangeLabel(bookings: BookingRow[]): string {
  if (bookings.length === 0) return "";
  const dates = bookings.flatMap((b) => [parseDate(b.check_in), parseDate(b.check_out)]);
  const from = minDate(dates);
  const to = maxDate(dates);
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  return `Data covers ${format(from, "MMM yyyy")} – ${format(to, "MMM yyyy")} (${months} months)`;
}

export function uniquePropertyIds(bookings: BookingRow[]): string[] {
  return [...new Set(bookings.map((b) => b.property_id))];
}

export function propertyMapFromRows(
  properties: RsaPropertyMapping[],
): Map<string, RsaPropertyMapping> {
  return new Map(properties.map((p) => [p.uplisting_property_id, p]));
}
