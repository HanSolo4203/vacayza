"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatZAR } from "../../../lib/format";
import { RSA_BEDROOM_OPTIONS, RSA_SUBURBS } from "../../../lib/rsa-suburbs";
import {
  bookingDateRangeLabel,
  getConfidenceLevel,
  parseCSV,
  uniquePropertyIds,
  type BookingRow,
  type ConfidenceLevel,
  type MarketBenchmark,
} from "../../../lib/uplisting-parser";

const inputClass =
  "w-full border border-[#333] bg-black p-2 font-mono text-[10px] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber";

interface RsaPropertyRow {
  id?: string;
  uplisting_property_id: string;
  display_name: string;
  suburb: string;
  suburb_display: string;
  bedrooms: number;
  property_type: string;
  active: boolean;
}

function emptyPropertyRow(): RsaPropertyRow {
  const defaultSuburb = RSA_SUBURBS[5];
  return {
    uplisting_property_id: "",
    display_name: "",
    suburb: defaultSuburb.value,
    suburb_display: defaultSuburb.label,
    bedrooms: 1,
    property_type: "apartment",
    active: true,
  };
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const styles: Record<ConfidenceLevel, string> = {
    HIGH: "border-green-700 text-green-400",
    MEDIUM: "border-amber-700 text-vacayza-amber",
    LOW: "border-red-800 text-red-400",
    FALLBACK: "border-[#444] text-vacayza-muted",
  };
  return (
    <span className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${styles[level]}`}>
      {level}
    </span>
  );
}

export default function MarketDataAdminPage() {
  const [properties, setProperties] = useState<RsaPropertyRow[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [savingProps, setSavingProps] = useState(false);
  const [propsError, setPropsError] = useState("");
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState<RsaPropertyRow>(emptyPropertyRow);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [benchmarks, setBenchmarks] = useState<MarketBenchmark[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [savingBenchmarks, setSavingBenchmarks] = useState(false);
  const [benchError, setBenchError] = useState("");
  const [calcSummary, setCalcSummary] = useState("");

  const mappingSectionRef = useRef<HTMLDivElement>(null);

  const loadStoredBenchmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rsa-benchmarks");
      const json = await res.json();
      if (json.success && Array.isArray(json.benchmarks) && json.benchmarks.length > 0) {
        setBenchmarks(
          json.benchmarks.map(
            (b: {
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
            }) => ({
              suburb: b.suburb,
              bedrooms: b.bedrooms,
              sample_size: b.sample_size ?? 0,
              avg_adr: b.avg_adr ?? 0,
              avg_occupancy_pct: b.avg_occupancy_pct ?? 0,
              avg_annual_revenue: b.avg_annual_revenue ?? 0,
              seasonal_index: b.seasonal_index ?? {},
              channel_mix: b.channel_mix ?? {},
              confidence_level: b.confidence_level ?? "FALLBACK",
              data_from: b.data_from ?? "",
              data_to: b.data_to ?? "",
            }),
          ),
        );
      }
    } catch {
      // ignore — empty state is fine
    }
  }, []);

  const loadProperties = useCallback(async () => {
    setLoadingProps(true);
    try {
      const res = await fetch("/api/admin/rsa-properties");
      const json = await res.json();
      if (json.success) {
        setProperties(
          (json.properties ?? []).map(
            (p: {
              id: string;
              uplisting_property_id: string;
              display_name: string | null;
              suburb: string;
              suburb_display: string;
              bedrooms: number;
              property_type: string;
              active: boolean;
            }) => ({
              id: p.id,
              uplisting_property_id: p.uplisting_property_id,
              display_name: p.display_name ?? "",
              suburb: p.suburb,
              suburb_display: p.suburb_display,
              bedrooms: p.bedrooms,
              property_type: p.property_type ?? "apartment",
              active: p.active !== false,
            }),
          ),
        );
      }
    } finally {
      setLoadingProps(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
    loadStoredBenchmarks();
  }, [loadProperties, loadStoredBenchmarks]);

  const propertyIdSet = useMemo(
    () => new Set(properties.filter((p) => p.active).map((p) => p.uplisting_property_id)),
    [properties],
  );

  const csvPropertyIds = useMemo(() => uniquePropertyIds(bookings), [bookings]);
  const unmappedCount = useMemo(
    () => csvPropertyIds.filter((id) => !propertyIdSet.has(id)).length,
    [csvPropertyIds, propertyIdSet],
  );

  const handleFile = async (file: File) => {
    setCsvError("");
    try {
      const rows = await parseCSV(file);
      setBookings(rows);
      setBenchmarks([]);
      setCalcSummary("");
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "Failed to parse CSV.");
      setBookings([]);
    }
  };

  const updateProperty = (index: number, patch: Partial<RsaPropertyRow>) => {
    setProperties((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.suburb) {
          const suburbMeta = RSA_SUBURBS.find((s) => s.value === patch.suburb);
          if (suburbMeta) next.suburb_display = suburbMeta.label;
        }
        return next;
      }),
    );
  };

  const saveAllProperties = async () => {
    setSavingProps(true);
    setPropsError("");
    try {
      const payload = properties.map((p) => {
        const suburbMeta = RSA_SUBURBS.find((s) => s.value === p.suburb);
        return {
          ...p,
          suburb_display: p.suburb_display || suburbMeta?.label || p.suburb,
        };
      });

      const res = await fetch("/api/admin/rsa-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: payload }),
      });

      let json: {
        success?: boolean;
        error?: string;
        properties?: Array<{
          id: string;
          uplisting_property_id: string;
          display_name: string | null;
          suburb: string;
          suburb_display: string;
          bedrooms: number;
          property_type: string;
          active: boolean;
        }>;
      };
      try {
        json = await res.json();
      } catch {
        setPropsError(`Save failed (${res.status}). Restart the dev server and try again.`);
        return;
      }

      if (!res.ok || !json.success) {
        setPropsError(json.error || `Save failed (${res.status}).`);
        return;
      }

      if (Array.isArray(json.properties)) {
        setProperties(
          json.properties.map(
            (p: {
              id: string;
              uplisting_property_id: string;
              display_name: string | null;
              suburb: string;
              suburb_display: string;
              bedrooms: number;
              property_type: string;
              active: boolean;
            }) => ({
              id: p.id,
              uplisting_property_id: p.uplisting_property_id,
              display_name: p.display_name ?? "",
              suburb: p.suburb,
              suburb_display: p.suburb_display,
              bedrooms: p.bedrooms,
              property_type: p.property_type ?? "apartment",
              active: p.active !== false,
            }),
          ),
        );
      } else {
        await loadProperties();
      }
      setAddingRow(false);
    } catch (err) {
      setPropsError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingProps(false);
    }
  };

  const runCalculate = async () => {
    setCalculating(true);
    setBenchError("");
    try {
      const activeMappings = properties
        .filter((p) => p.active && p.uplisting_property_id)
        .map((p) => ({
          uplisting_property_id: p.uplisting_property_id,
          suburb: p.suburb,
          suburb_display: p.suburb_display,
          bedrooms: p.bedrooms,
        }));

      const res = await fetch("/api/calculate-benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookings,
          properties: activeMappings,
          persist: false,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setBenchError(json.error || "Calculation failed.");
        return;
      }
      setBenchmarks(json.benchmarks ?? []);
      setCalcSummary(
        `${json.summary?.portfolioDerived ?? 0} portfolio benchmarks, ${json.summary?.fallbackFilled ?? 0} index fallbacks`,
      );
    } catch {
      setBenchError("Calculation failed.");
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculate = () => {
    void runCalculate();
  };

  const saveBenchmarks = async () => {
    if (benchmarks.length === 0) return;
    setSavingBenchmarks(true);
    setBenchError("");
    try {
      const activeMappings = properties
        .filter((p) => p.active && p.uplisting_property_id)
        .map((p) => ({
          uplisting_property_id: p.uplisting_property_id,
          suburb: p.suburb,
          suburb_display: p.suburb_display,
          bedrooms: p.bedrooms,
        }));

      const res = await fetch("/api/calculate-benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookings,
          properties: activeMappings,
          persist: true,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setBenchError(json.error || "Save failed.");
        return;
      }
      setBenchmarks(json.benchmarks ?? benchmarks);
      setCalcSummary(`Saved ${json.summary?.benchmarksCalculated ?? 0} benchmarks to database`);
    } catch {
      setBenchError("Save failed.");
    } finally {
      setSavingBenchmarks(false);
    }
  };

  const coverageCell = (suburb: string, bedrooms: number) => {
    const b = benchmarks.find((x) => x.suburb === suburb && x.bedrooms === bedrooms);
    if (!b) return "empty";
    if (b.confidence_level === "FALLBACK") return "fallback";
    return "data";
  };

  const sortedBenchmarks = useMemo(
    () =>
      [...benchmarks].sort(
        (a, b) =>
          a.suburb.localeCompare(b.suburb) || a.bedrooms - b.bedrooms,
      ),
    [benchmarks],
  );

  return (
    <main className="min-h-screen bg-vacayza-black text-vacayza-off-white">
      <header className="border-b border-[#333] px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xs uppercase tracking-[0.25em] text-vacayza-muted hover:text-vacayza-amber">
            ← Vacayza
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-[10px] uppercase tracking-[0.15em] text-vacayza-muted hover:text-vacayza-amber"
            >
              Intake
            </Link>
            <span className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">
              Market Data — RSA Portfolio
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10 md:px-8">
        {/* SECTION 1 */}
        <section ref={mappingSectionRef} className="border border-[#333] p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">01 — Property mapping</p>
          <p className="mt-3 max-w-2xl text-[11px] leading-6 text-vacayza-muted">
            Map your Uplisting property IDs to suburbs and bedroom counts. This is a one-time setup. Use the numeric
            &apos;Property ID&apos; column from your Uplisting owner statement export (not the property nickname).
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[10px]">
              <thead>
                <tr className="border-b border-[#333] uppercase tracking-[0.12em] text-vacayza-muted">
                  <th className="py-2 pr-2">Uplisting ID</th>
                  <th className="py-2 pr-2">Display Name</th>
                  <th className="py-2 pr-2">Suburb</th>
                  <th className="py-2 pr-2">Beds</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {loadingProps && (
                  <tr>
                    <td colSpan={6} className="py-4 text-vacayza-muted">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loadingProps &&
                  properties.map((row, index) => (
                    <tr key={row.id ?? `row-${index}`} className="border-b border-[#222]">
                      <td className="py-2 pr-2">
                        <input
                          value={row.uplisting_property_id}
                          onChange={(e) => updateProperty(index, { uplisting_property_id: e.target.value })}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          value={row.display_name}
                          onChange={(e) => updateProperty(index, { display_name: e.target.value })}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={row.suburb}
                          onChange={(e) => updateProperty(index, { suburb: e.target.value })}
                          className={inputClass}
                        >
                          {RSA_SUBURBS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={row.bedrooms}
                          onChange={(e) => updateProperty(index, { bedrooms: Number(e.target.value) })}
                          className={inputClass}
                        >
                          {RSA_BEDROOM_OPTIONS.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          value={row.property_type}
                          onChange={(e) => updateProperty(index, { property_type: e.target.value })}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={row.active}
                          onChange={(e) => updateProperty(index, { active: e.target.checked })}
                          className="accent-vacayza-amber"
                        />
                      </td>
                    </tr>
                  ))}
                {addingRow && (
                  <tr className="border-b border-vacayza-amber/40 bg-[#0d0d0d]">
                    <td className="py-2 pr-2">
                      <input
                        value={newRow.uplisting_property_id}
                        onChange={(e) => setNewRow((r) => ({ ...r, uplisting_property_id: e.target.value }))}
                        placeholder="property_id"
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={newRow.display_name}
                        onChange={(e) => setNewRow((r) => ({ ...r, display_name: e.target.value }))}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={newRow.suburb}
                        onChange={(e) => {
                          const suburb = e.target.value;
                          const label = RSA_SUBURBS.find((s) => s.value === suburb)?.label ?? suburb;
                          setNewRow((r) => ({ ...r, suburb, suburb_display: label }));
                        }}
                        className={inputClass}
                      >
                        {RSA_SUBURBS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={newRow.bedrooms}
                        onChange={(e) => setNewRow((r) => ({ ...r, bedrooms: Number(e.target.value) }))}
                        className={inputClass}
                      >
                        {RSA_BEDROOM_OPTIONS.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={newRow.property_type}
                        onChange={(e) => setNewRow((r) => ({ ...r, property_type: e.target.value }))}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newRow.uplisting_property_id.trim()) return;
                          setProperties((p) => [...p, { ...newRow }]);
                          setNewRow(emptyPropertyRow());
                          setAddingRow(false);
                        }}
                        className="text-[9px] uppercase tracking-[0.12em] text-vacayza-amber"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAddingRow(true)}
              className="border border-[#333] px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-off-white hover:border-vacayza-amber"
            >
              Add property
            </button>
            <button
              type="button"
              onClick={saveAllProperties}
              disabled={savingProps}
              className="bg-vacayza-amber px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-black disabled:opacity-50"
            >
              {savingProps ? "Saving..." : "Save all"}
            </button>
          </div>
          {propsError && <p className="mt-3 text-xs text-red-400">{propsError}</p>}
        </section>

        {/* SECTION 2 */}
        <section className="border border-[#333] p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">02 — CSV upload</p>

          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            className={`mt-6 cursor-pointer border border-dashed p-12 text-center transition ${
              dragOver ? "border-vacayza-amber" : "border-[#333] hover:border-vacayza-amber"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
              Drop Uplisting bookings CSV here
            </p>
            <p className="mt-2 text-[10px] leading-5 text-vacayza-muted">
              Accepts Uplisting owner statement exports (Property ID, Check in, Check out, Total payout, Channel name).
              Cancelled bookings are excluded automatically.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>

          {csvError && <p className="mt-3 text-xs text-red-400">{csvError}</p>}

          {bookings.length > 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-[11px] text-vacayza-off-white">
                {bookings.length} bookings found across {csvPropertyIds.length} unique property IDs
              </p>
              <p className="text-[10px] text-vacayza-muted">{bookingDateRangeLabel(bookings)}</p>

              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#333] uppercase tracking-[0.12em] text-vacayza-muted">
                    <th className="py-2 text-left">Property ID</th>
                    <th className="py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPropertyIds.map((id) => {
                    const mapped = propertyIdSet.has(id);
                    return (
                      <tr key={id} className="border-b border-[#222]">
                        <td className="py-2 font-mono">{id}</td>
                        <td className="py-2">
                          {mapped ? (
                            <span className="text-green-400">✓ Mapped</span>
                          ) : (
                            <span className="text-vacayza-amber">
                              ✗ Not mapped —{" "}
                              <button
                                type="button"
                                className="underline"
                                onClick={() => mappingSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                              >
                                Map now
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button
                type="button"
                onClick={handleCalculate}
                disabled={unmappedCount > 0 || calculating}
                className="bg-vacayza-amber px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-black disabled:opacity-40"
              >
                {calculating ? "Calculating..." : "Calculate benchmarks"}
              </button>
              {unmappedCount > 0 && (
                <p className="text-[10px] text-vacayza-amber">
                  Map all {unmappedCount} unmapped property ID{unmappedCount === 1 ? "" : "s"} before calculating.
                </p>
              )}
            </div>
          )}
        </section>

        {/* SECTION 3 */}
        {benchmarks.length > 0 && (
          <section className="border border-[#333] p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">03 — Benchmark results</p>
            {calcSummary && <p className="mt-2 text-[10px] text-vacayza-muted">{calcSummary}</p>}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[800px] text-[10px]">
                <thead>
                  <tr className="border-b border-[#333] uppercase tracking-[0.12em] text-vacayza-muted">
                    <th className="py-2 pr-2 text-left">Suburb</th>
                    <th className="py-2 pr-2 text-left">Beds</th>
                    <th className="py-2 pr-2 text-right">ADR</th>
                    <th className="py-2 pr-2 text-right">Occupancy</th>
                    <th className="py-2 pr-2 text-right">Annual revenue</th>
                    <th className="py-2 pr-2 text-right">Sample</th>
                    <th className="py-2 pr-2 text-left">Confidence</th>
                    <th className="py-2 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBenchmarks.map((b) => {
                    const { label } = getConfidenceLevel(b.sample_size);
                    const suburbLabel = RSA_SUBURBS.find((s) => s.value === b.suburb)?.label ?? b.suburb;
                    const bedLabel = RSA_BEDROOM_OPTIONS.find((x) => x.value === b.bedrooms)?.label ?? b.bedrooms;
                    return (
                      <tr key={`${b.suburb}-${b.bedrooms}`} className="border-b border-[#222]">
                        <td className="py-2">{suburbLabel}</td>
                        <td className="py-2">{bedLabel}</td>
                        <td className="py-2 text-right">{formatZAR(b.avg_adr)}</td>
                        <td className="py-2 text-right">{b.avg_occupancy_pct}%</td>
                        <td className="py-2 text-right">{formatZAR(b.avg_annual_revenue)}</td>
                        <td className="py-2 text-right">{b.sample_size}</td>
                        <td className="py-2">
                          <ConfidenceBadge level={b.confidence_level} />
                          <span className="ml-1 text-vacayza-muted">{label}</span>
                        </td>
                        <td className="py-2 text-vacayza-muted">
                          {b.data_from && b.data_to ? `${b.data_from} → ${b.data_to}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={saveBenchmarks}
              disabled={savingBenchmarks}
              className="mt-6 border border-vacayza-amber px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-vacayza-amber disabled:opacity-50"
            >
              {savingBenchmarks ? "Saving..." : "Save to database"}
            </button>
            {benchError && <p className="mt-3 text-xs text-red-400">{benchError}</p>}
          </section>
        )}

        {/* SECTION 4 */}
        <section className="border border-[#333] p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">04 — Benchmark coverage</p>
          <p className="mt-2 text-[10px] text-vacayza-muted">
            Green = portfolio data · Amber = suburb index fallback · Empty = no benchmark yet
          </p>

          <div className="mt-6 overflow-x-auto">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `100px repeat(${RSA_BEDROOM_OPTIONS.length}, minmax(64px, 1fr))`,
              }}
            >
              <div />
              {RSA_BEDROOM_OPTIONS.map((b) => (
                <div key={b.value} className="text-center text-[9px] uppercase tracking-[0.1em] text-vacayza-muted">
                  {b.label}
                </div>
              ))}
              {RSA_SUBURBS.map((suburb) => (
                <Fragment key={suburb.value}>
                  <div className="flex items-center text-[9px] uppercase tracking-[0.08em] text-vacayza-muted">
                    {suburb.label}
                  </div>
                  {RSA_BEDROOM_OPTIONS.map((bed) => {
                    const state = coverageCell(suburb.value, bed.value);
                    const bg =
                      state === "data"
                        ? "bg-green-900/50 border-green-800"
                        : state === "fallback"
                          ? "bg-amber-900/30 border-amber-800"
                          : "bg-black border-[#222]";
                    return (
                      <div
                        key={`${suburb.value}-${bed.value}`}
                        className={`h-10 border ${bg}`}
                        title={state}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
