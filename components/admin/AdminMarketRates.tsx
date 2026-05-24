"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatZAR } from "../../lib/format";
import {
  BEDROOM_KEYS,
  SUBURBS,
  bedroomKeyLabel,
  strDerivedFromRates,
  type MarketRateRow,
} from "../../lib/market-rates";

const inputClass =
  "w-full border border-[#333] bg-black p-2 font-mono text-[10px] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber";

const derivedClass = "font-mono text-[10px] text-vacayza-muted tabular-nums";

export default function AdminMarketRates({
  rates,
  onChange,
  onSave,
  saving,
  error,
}: {
  rates: MarketRateRow[];
  onChange: (rates: MarketRateRow[]) => void;
  onSave: () => void;
  saving: boolean;
  error: string;
}) {
  const [activeSuburb, setActiveSuburb] = useState<string>(SUBURBS[0].value);

  const suburbRates = useMemo(
    () => rates.filter((row) => row.suburb === activeSuburb),
    [rates, activeSuburb],
  );

  const updateRow = (bedroomKey: MarketRateRow["bedroomKey"], patch: Partial<MarketRateRow>) => {
    onChange(
      rates.map((row) =>
        row.suburb === activeSuburb && row.bedroomKey === bedroomKey ? { ...row, ...patch } : row,
      ),
    );
  };

  return (
    <div className="mb-8 border border-[#333] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">Market rates</p>
          <p className="mt-2 text-[10px] leading-5 text-vacayza-muted">
            STR nightly rate and occupancy, plus LTR monthly rent, by suburb and bedroom count. Gross
            annual, peak/low, and net-after-management update live from your STR inputs (80% net of
            gross).
          </p>
          <p className="mt-2 text-[10px] leading-5 text-vacayza-muted">
            For portfolio-derived ADR and occupancy from Uplisting bookings, use{" "}
            <Link href="/admin/market-data" className="text-vacayza-amber hover:underline">
              Market data — RSA Portfolio
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="shrink-0 border border-vacayza-amber px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save rates"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {SUBURBS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveSuburb(value)}
            className={`px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${
              activeSuburb === value
                ? "bg-vacayza-amber text-black"
                : "border border-[#333] text-vacayza-muted hover:border-vacayza-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[880px] space-y-3">
          <div className="grid grid-cols-[0.9fr_repeat(7,1fr)] gap-2 text-[9px] uppercase tracking-[0.12em] text-vacayza-muted">
            <span>Bedrooms</span>
            <span>STR / night</span>
            <span>Occupancy %</span>
            <span>Peak / night</span>
            <span>Low / night</span>
            <span>Gross / yr</span>
            <span>Net / yr (80%)</span>
            <span>LTR / month</span>
          </div>

          {BEDROOM_KEYS.map((bedroomKey) => {
            const row = suburbRates.find((r) => r.bedroomKey === bedroomKey);
            if (!row) return null;

            const derived = strDerivedFromRates(row.strNightlyRate, row.strOccupancyPct);

            return (
              <div
                key={bedroomKey}
                className="grid grid-cols-[0.9fr_repeat(7,1fr)] items-center gap-2"
              >
                <span className="text-[10px] uppercase tracking-[0.1em] text-vacayza-off-white">
                  {bedroomKeyLabel(bedroomKey)}
                </span>
                <input
                  type="number"
                  min={1}
                  value={row.strNightlyRate || ""}
                  onChange={(e) => updateRow(bedroomKey, { strNightlyRate: Number(e.target.value) })}
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={row.strOccupancyPct || ""}
                  onChange={(e) => updateRow(bedroomKey, { strOccupancyPct: Number(e.target.value) })}
                  className={inputClass}
                />
                <span className={derivedClass}>{formatZAR(derived.peakRate)}</span>
                <span className={derivedClass}>{formatZAR(derived.lowRate)}</span>
                <span className={derivedClass}>{formatZAR(derived.grossAnnual)}</span>
                <span className={derivedClass}>{formatZAR(derived.netAfterManagement)}</span>
                <input
                  type="number"
                  min={1}
                  value={row.ltrMonthlyRent || ""}
                  onChange={(e) => updateRow(bedroomKey, { ltrMonthlyRent: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
