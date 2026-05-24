#!/usr/bin/env node
/**
 * Analyze AirDNA / Inside Airbnb calendar.csv for seasonal occupancy.
 *
 * Usage:
 *   node scripts/analyze-calendar.mjs path/to/calendar.csv
 *
 * Columns: listing_id, date, available (t/f), price
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function normalizeHeaderKey(key) {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseAvailable(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "t" || v === "true" || v === "1" || v === "yes" || v === "y") return true;
  if (v === "f" || v === "false" || v === "0" || v === "no" || v === "n") return false;
  return true;
}

function parseCalendarDate(value) {
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return new Date(`${trimmed.slice(0, 10)}T00:00:00`);
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid calendar date: ${value}`);
  return d;
}

function calendarRowsFromCsv(csvText) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error: ${first?.message ?? "unknown"}`);
  }

  const rows = [];
  for (const raw of parsed.data) {
    const row = {};
    for (const [key, value] of Object.entries(raw)) {
      row[normalizeHeaderKey(key)] = String(value ?? "").trim();
    }
    const listingId = row.listing_id || row.id;
    const date = row.date || row.calendar_date;
    if (!listingId || !date) continue;
    rows.push({
      listing_id: listingId,
      date,
      available: parseAvailable(row.available ?? "t"),
    });
  }
  return rows;
}

function analyze(rows) {
  const listingIds = new Set();
  const bookedByMonth = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 0]));
  const totalByMonth = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 0]));

  for (const row of rows) {
    listingIds.add(row.listing_id);
    const month = parseCalendarDate(row.date).getMonth() + 1;
    totalByMonth[month] += 1;
    if (!row.available) bookedByMonth[month] += 1;
  }

  const monthly = [];
  for (let m = 1; m <= 12; m++) {
    if (totalByMonth[m] === 0) continue;
    monthly.push({
      month: m,
      bookedNights: bookedByMonth[m],
      totalNights: totalByMonth[m],
      occupancyPct: Math.round((bookedByMonth[m] / totalByMonth[m]) * 1000) / 10,
    });
  }

  const totalBooked = monthly.reduce((sum, m) => sum + m.bookedNights, 0);
  const totalNights = monthly.reduce((sum, m) => sum + m.totalNights, 0);
  const avgOcc = monthly.reduce((sum, m) => sum + m.occupancyPct, 0) / (monthly.length || 1);

  const seasonalIndex = {};
  for (const m of monthly) {
    seasonalIndex[m.month] =
      avgOcc > 0 && m.occupancyPct > 0 ? Math.round((m.occupancyPct / avgOcc) * 100) / 100 : 1;
  }

  return {
    listingCount: listingIds.size,
    totalBookedNights: totalBooked,
    totalNights,
    overallOccupancyPct: totalNights > 0 ? Math.round((totalBooked / totalNights) * 1000) / 10 : 0,
    monthly,
    seasonalIndex,
  };
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/analyze-calendar.mjs path/to/calendar.csv");
  process.exit(1);
}

const csvText = readFileSync(resolve(file), "utf8");
const analysis = analyze(calendarRowsFromCsv(csvText));

console.log(`Listings: ${analysis.listingCount.toLocaleString()}`);
console.log(`Overall occupancy: ${analysis.overallOccupancyPct}%`);
console.log(`Booked nights: ${analysis.totalBookedNights.toLocaleString()} / ${analysis.totalNights.toLocaleString()}`);
console.log("");
console.log("Month   Booked     Total    Occ%   Index");
console.log("-----   ------     -----    ----   -----");

for (const m of analysis.monthly) {
  const idx = analysis.seasonalIndex[m.month] ?? 1;
  const monthLabel = MONTH_NAMES[m.month - 1] || String(m.month);
  console.log(
    `${monthLabel.padEnd(5)}   ${String(m.bookedNights).padStart(6)}   ${String(m.totalNights).padStart(6)}   ${String(m.occupancyPct).padStart(5)}%   ${idx.toFixed(2)}`,
  );
}
