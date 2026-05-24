// TODO: Protect with NextAuth or Supabase Auth

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminIntakeList from "../../components/admin/AdminIntakeList";
import AdminListingFields from "../../components/admin/AdminListingFields";
import AdminMarketRates from "../../components/admin/AdminMarketRates";
import AdminPhotoManager from "../../components/admin/AdminPhotoManager";
import AdminMapLocation from "../../components/admin/AdminMapLocation";
import AnimatedNumber from "../../components/AnimatedNumber";
import { formatPercent, formatZAR } from "../../lib/format";
import { DEFAULT_MAINTENANCE_RESERVE_PCT } from "../../lib/app-settings";
import { calculateInvestmentMetrics } from "../../lib/investment";
import {
  DEFAULT_MARKET_RATES,
  SUBURBS,
  defaultMarketRateRows,
  tablesFromRows,
  type MarketRateRow,
  type MarketRatesTables,
} from "../../lib/market-rates";
import type { PropertyRecord } from "../../lib/property-db";
import { sanitizeMapAddress } from "../../lib/street-address";
import type { PropertyListingData } from "../../lib/types";

function withSanitizedMapAddress(data: PropertyListingData): PropertyListingData {
  return { ...data, address: sanitizeMapAddress(data.address, data.title) };
}

type ScrapeStatus = "idle" | "fetching" | "parsing" | "calculating" | "ready" | "error";
const inputClass =
  "w-full border border-[#333] bg-black p-3 font-mono text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber";

const STATUS_LABELS: Record<Exclude<ScrapeStatus, "idle" | "ready" | "error">, string> = {
  fetching: "FETCHING...",
  parsing: "PARSING DATA...",
  calculating: "CALCULATING YIELDS...",
};

function AmberDot() {
  return (
    <span className="inline-flex items-center gap-2">
      <motion.span
        className="inline-block h-2 w-2 bg-vacayza-amber"
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <span className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">Working</span>
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="border border-[#333] px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-vacayza-off-white">
      {value} {label}
    </span>
  );
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[#333] py-3 text-xs">
      <span className="uppercase tracking-[0.12em] text-vacayza-muted">{label}</span>
      <span className={highlight ? "text-vacayza-amber" : "text-vacayza-off-white"}>{value}</span>
    </div>
  );
}

export default function AdminPage() {
  const [intakes, setIntakes] = useState<PropertyRecord[]>([]);
  const [loadingIntakes, setLoadingIntakes] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ScrapeStatus>("idle");
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [data, setData] = useState<PropertyListingData | null>(null);
  const [agentNotes, setAgentNotes] = useState("");
  const [vacayzaScore, setVacayzaScore] = useState(8);
  const [publishToggle, setPublishToggle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [maintenanceReservePct, setMaintenanceReservePct] = useState(DEFAULT_MAINTENANCE_RESERVE_PCT);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [marketRateRows, setMarketRateRows] = useState<MarketRateRow[]>(defaultMarketRateRows());
  const [marketRates, setMarketRates] = useState<MarketRatesTables>(DEFAULT_MARKET_RATES);
  const [savingMarketRates, setSavingMarketRates] = useState(false);
  const [marketRatesError, setMarketRatesError] = useState("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [manualForm, setManualForm] = useState({
    price: "",
    bedrooms: "1",
    bathrooms: "1",
    parking: "0",
    suburb: "cape-town-city-centre",
    address: "",
    title: "",
    description: "",
  });

  const loadIntakes = useCallback(async () => {
    setLoadingIntakes(true);
    try {
      const res = await fetch("/api/admin/properties");
      const json = await res.json();
      if (json.success) setIntakes(json.properties ?? []);
    } finally {
      setLoadingIntakes(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.success) setMaintenanceReservePct(json.maintenanceReservePct ?? DEFAULT_MAINTENANCE_RESERVE_PCT);
    } catch {
      setMaintenanceReservePct(DEFAULT_MAINTENANCE_RESERVE_PCT);
    }
  }, []);

  const loadMarketRates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/market-rates");
      const json = await res.json();
      if (json.success && Array.isArray(json.rates)) {
        setMarketRateRows(json.rates);
        setMarketRates(tablesFromRows(json.rates));
      }
    } catch {
      setMarketRateRows(defaultMarketRateRows());
      setMarketRates(DEFAULT_MARKET_RATES);
    }
  }, []);

  const applyMetrics = useCallback(
    (listing: PropertyListingData, reservePct: number, rates: MarketRatesTables = marketRates) => {
      const metrics = calculateInvestmentMetrics(listing, {
        maintenanceReservePct: reservePct,
        marketRates: rates,
      });
      return { ...listing, ...metrics };
    },
    [marketRates],
  );

  const saveMaintenanceReserve = useCallback(async (pct: number) => {
    setSavingSettings(true);
    setSettingsError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceReservePct: pct }),
      });
      const json = await res.json();
      if (!json.success) {
        setSettingsError(json.error || "Failed to save settings.");
        return;
      }
      setMaintenanceReservePct(json.maintenanceReservePct);
    } catch {
      setSettingsError("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  }, []);

  const saveMarketRates = useCallback(async () => {
    setSavingMarketRates(true);
    setMarketRatesError("");
    try {
      const res = await fetch("/api/admin/market-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: marketRateRows }),
      });
      const json = await res.json();
      if (!json.success) {
        setMarketRatesError(json.error || "Failed to save market rates.");
        return;
      }
      const rows = json.rates ?? marketRateRows;
      const tables = tablesFromRows(rows);
      setMarketRateRows(rows);
      setMarketRates(tables);
      if (data) setData(applyMetrics(data, maintenanceReservePct, tables));
    } catch {
      setMarketRatesError("Failed to save market rates.");
    } finally {
      setSavingMarketRates(false);
    }
  }, [applyMetrics, data, maintenanceReservePct, marketRateRows]);

  const handleMaintenanceReserveChange = (pct: number) => {
    setMaintenanceReservePct(pct);
    if (data) setData(applyMetrics(data, pct));
  };

  useEffect(() => {
    loadIntakes();
    loadSettings();
    loadMarketRates();
  }, [loadIntakes, loadSettings, loadMarketRates]);

  const startNewIntake = useCallback(() => {
    setEditingId(null);
    setData(null);
    setAgentNotes("");
    setVacayzaScore(8);
    setPublishToggle(true);
    setSaveError("");
    setSavedSlug(null);
    setStatus("idle");
    setError("");
    setUrl("");
    setManualMode(false);
    setMapCoords(null);
  }, []);

  const selectIntake = useCallback(async (id: string) => {
    setSaveError("");
    setSavedSlug(null);
    setError("");
    setStatus("idle");

    try {
      const res = await fetch(`/api/admin/properties/${id}`);
      const json = await res.json();
      if (!json.success) {
        setSaveError(json.error || "Failed to load intake.");
        return;
      }
      setEditingId(id);
      setData(applyMetrics(withSanitizedMapAddress(json.data), maintenanceReservePct));
      setAgentNotes(json.property.agent_notes ?? "");
      setVacayzaScore(json.property.vacayza_score ?? 8);
      setPublishToggle(json.property.published ?? false);
      setUrl(json.property.source_url ?? "");
      if (json.property.latitude != null && json.property.longitude != null) {
        setMapCoords({ lat: json.property.latitude, lng: json.property.longitude });
      } else {
        setMapCoords(null);
      }
    } catch {
      setSaveError("Failed to load intake.");
    }
  }, [applyMetrics, maintenanceReservePct]);

  const runScrape = useCallback(async (payload: { url?: string; manual?: Record<string, unknown> }) => {
    setError("");
    setSaveError("");
    setStatus("fetching");

    const timers = [
      setTimeout(() => setStatus("parsing"), 600),
      setTimeout(() => setStatus("calculating"), 1400),
    ];

    try {
      const res = await fetch("/api/scrape-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(payload.manual ? { manual: true, data: payload.manual } : { url: payload.url }),
          save: true,
          published: publishToggle,
          vacayzaScore,
          agentNotes,
          existingId: editingId,
        }),
      });
      const json = await res.json();
      timers.forEach(clearTimeout);

      if (!json.success) {
        setStatus("error");
        setError(json.error || "Scrape failed.");
        setManualMode(true);
        return;
      }

      setData(applyMetrics(withSanitizedMapAddress(json.data), maintenanceReservePct));
      setMapCoords(null);
      setStatus("ready");
      setManualMode(false);

      if (json.saved && json.id) {
        setEditingId(json.id);
        setSavedSlug(json.slug ?? null);
        await loadIntakes();
      }
    } catch {
      timers.forEach(clearTimeout);
      setStatus("error");
      setError("Unable to scrape listing. Property24 may be blocking the request. Try again in a few seconds.");
      setManualMode(true);
    }
  }, [agentNotes, applyMetrics, editingId, loadIntakes, maintenanceReservePct, publishToggle, vacayzaScore]);

  const handleScrape = () => {
    if (!url.trim()) return;
    runScrape({ url: url.trim() });
  };

  const handleManualCalculate = () => {
    runScrape({
      manual: {
        price: Number(manualForm.price),
        bedrooms: Number(manualForm.bedrooms),
        bathrooms: Number(manualForm.bathrooms),
        parking: Number(manualForm.parking),
        suburb: manualForm.suburb,
        address: manualForm.address || manualForm.suburb,
        title: manualForm.title || "Manual Property Listing",
        description: manualForm.description,
        sourceUrl: url || "",
      },
    });
  };

  const handleRecalculate = async () => {
    if (!data) return;
    setRecalculating(true);
    setSaveError("");
    try {
      const res = await fetch("/api/scrape-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          data: {
            price: data.price,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            parking: data.parking,
            suburb: data.suburb,
            address: data.address,
            title: data.title,
            description: data.description,
            sourceUrl: data.sourceUrl,
            propertyType: data.propertyType,
            images: data.images,
            features: data.features,
            listingStatus: data.listingStatus,
            levies: data.levies,
            ratesAndTaxes: data.ratesAndTaxes,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setSaveError(json.error || "Recalculation failed.");
        return;
      }
      setData(applyMetrics(json.data, maintenanceReservePct));
    } catch {
      setSaveError("Recalculation failed.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setSaveError("");

    try {
      const endpoint = editingId ? `/api/admin/properties/${editingId}` : "/api/admin/properties";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, agentNotes, vacayzaScore, published: publishToggle }),
      });
      const json = await res.json();
      if (!json.success) {
        setSaveError(json.error || "Save failed.");
        return;
      }
      setSavedSlug(json.slug);
      const propertyId = json.id ?? editingId;
      if (json.id) setEditingId(json.id);

      await loadIntakes();
    } catch {
      setSaveError("Failed to save listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm("Delete this intake permanently? This cannot be undone.")) return;
    setDeleting(true);
    setSaveError("");

    try {
      const res = await fetch(`/api/admin/properties/${editingId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setSaveError(json.error || "Delete failed.");
        return;
      }
      startNewIntake();
      await loadIntakes();
    } catch {
      setSaveError("Failed to delete listing.");
    } finally {
      setDeleting(false);
    }
  };

  const descriptionPreview =
    data?.description && data.description.length > 200 && !descExpanded
      ? `${data.description.slice(0, 200)}...`
      : data?.description ?? "";

  const visibleFeatures = featuresExpanded ? data?.features ?? [] : (data?.features ?? []).slice(0, 6);

  return (
    <main className="min-h-screen bg-vacayza-black text-vacayza-off-white">
      <header className="border-b border-[#333] px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between">
          <Link href="/" className="text-xs uppercase tracking-[0.25em] text-vacayza-muted hover:text-vacayza-amber">
            ← Vacayza
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/market-data"
              className="text-[10px] uppercase tracking-[0.15em] text-vacayza-muted hover:text-vacayza-amber"
            >
              Market data
            </Link>
            <span className="text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">Admin — Intake & CRM</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1800px] grid-cols-1 lg:grid-cols-[25%_40%_35%]">
        {/* COLUMN 1: INPUT */}
        <aside className="border-b border-[#333] p-6 lg:border-b-0 lg:border-r">
          <AdminIntakeList
            intakes={intakes}
            selectedId={editingId}
            loading={loadingIntakes}
            onSelect={selectIntake}
            onNew={startNewIntake}
          />

          <div className="mb-8 border border-[#333] p-4">
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">Platform settings</p>
            <label className="block">
              <span className="mb-3 block text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">
                Maintenance Reserve: {maintenanceReservePct}% of net income
              </span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={maintenanceReservePct}
                onChange={(e) => handleMaintenanceReserveChange(Number(e.target.value))}
                onMouseUp={(e) => saveMaintenanceReserve(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => saveMaintenanceReserve(Number((e.target as HTMLInputElement).value))}
                className="w-full accent-vacayza-amber"
              />
              <p className="mt-2 text-[10px] leading-5 text-vacayza-muted">
                Annual deduction from net income, alongside rates, taxes, and levies.
              </p>
              {savingSettings && (
                <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">Saving...</p>
              )}
              {settingsError && <p className="mt-2 text-xs text-red-400">{settingsError}</p>}
            </label>
          </div>

          <AdminMarketRates
            rates={marketRateRows}
            onChange={setMarketRateRows}
            onSave={saveMarketRates}
            saving={savingMarketRates}
            error={marketRatesError}
          />

          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-muted">
            {editingId ? "Edit intake" : "New intake"}
          </p>

          <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">
            Property24 URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.property24.com/..."
            className={inputClass}
          />

          <button
            type="button"
            onClick={handleScrape}
            disabled={status === "fetching" || status === "parsing" || status === "calculating"}
            className="mt-4 w-full bg-vacayza-amber px-4 py-3 text-[12px] uppercase tracking-[0.2em] text-black disabled:opacity-50"
          >
            Scrape Listing
          </button>

          <div className="mt-4 min-h-[24px]">
            {(status === "fetching" || status === "parsing" || status === "calculating") && (
              <div className="space-y-2">
                <AmberDot />
                <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                  {STATUS_LABELS[status]}
                </p>
              </div>
            )}
            {status === "ready" && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">
                Ready{savedSlug ? " — saved to database" : ""}
              </p>
            )}
            {status === "error" && (
              <div className="space-y-3">
                <p className="text-xs leading-6 text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={() => (url.trim() ? handleScrape() : setManualMode(true))}
                  className="border border-[#333] px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-off-white hover:border-vacayza-amber"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {manualMode && (
            <div className="mt-8 border border-[#333] p-4">
              <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">Manual Override</p>
              <div className="space-y-3">
                <input
                  placeholder="Price (R)"
                  value={manualForm.price}
                  onChange={(e) => setManualForm((f) => ({ ...f, price: e.target.value }))}
                  className={inputClass}
                />
                <input
                  placeholder="Street address (e.g. 16 Bree Street)"
                  value={manualForm.address}
                  onChange={(e) => setManualForm((f) => ({ ...f, address: e.target.value }))}
                  className={inputClass}
                  autoComplete="street-address"
                />
                <select
                  value={manualForm.suburb}
                  onChange={(e) => setManualForm((f) => ({ ...f, suburb: e.target.value }))}
                  className={inputClass}
                >
                  {SUBURBS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Beds"
                    value={manualForm.bedrooms}
                    onChange={(e) => setManualForm((f) => ({ ...f, bedrooms: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    placeholder="Baths"
                    value={manualForm.bathrooms}
                    onChange={(e) => setManualForm((f) => ({ ...f, bathrooms: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    placeholder="Parking"
                    value={manualForm.parking}
                    onChange={(e) => setManualForm((f) => ({ ...f, parking: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder="Description"
                  rows={3}
                  value={manualForm.description}
                  onChange={(e) => setManualForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleManualCalculate}
                  className="w-full border border-vacayza-amber px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber"
                >
                  Calculate Yields
                </button>
              </div>
            </div>
          )}

          {data && (
            <div className="mt-8 space-y-6 border-t border-[#333] pt-8">
              <AdminListingFields
                data={data}
                onChange={setData}
                onRecalculate={handleRecalculate}
                recalculating={recalculating}
              />

              <AdminMapLocation
                propertySyncKey={editingId ?? data.sourceUrl}
                address={data.address}
                onAddressChange={(address) => setData({ ...data, address })}
                propertyId={editingId}
                propertyTitle={data.title}
                price={data.price}
                coords={mapCoords}
                initialCoords={mapCoords}
                onCoordsChange={setMapCoords}
                onCoordsPersisted={(streetAddress) =>
                  setData((prev) => (prev ? { ...prev, address: streetAddress } : prev))
                }
                publishEnabled={publishToggle}
              />

              <label className="block">
                <span className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">
                  Agent Notes
                </span>
                <textarea
                  rows={4}
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  placeholder="Add your investment thesis, local knowledge, or specific notes for investors..."
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">
                  Investment Score: {vacayzaScore}/10
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={vacayzaScore}
                  onChange={(e) => setVacayzaScore(Number(e.target.value))}
                  className="w-full accent-vacayza-amber"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">Publish to Site</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={publishToggle}
                  onClick={() => setPublishToggle((v) => !v)}
                  className={`relative h-6 w-11 border border-[#333] ${publishToggle ? "bg-vacayza-amber" : "bg-black"}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 bg-black transition-all ${publishToggle ? "left-6" : "left-0.5"}`}
                  />
                </button>
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-vacayza-amber px-4 py-4 text-[12px] uppercase tracking-[0.2em] text-black disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update listing" : "Save listing"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full border border-red-900 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-red-400 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete intake"}
                </button>
              )}

              {saveError && <p className="text-xs leading-6 text-red-400">{saveError}</p>}

              {savedSlug && publishToggle && (
                <div className="space-y-2 text-[11px] uppercase tracking-[0.15em] text-vacayza-amber">
                  <p>
                    Saved →{" "}
                    <Link href={`/properties/${savedSlug}`} className="underline">
                      /properties/{savedSlug}
                    </Link>
                  </p>
                  <p>
                    <Link href="/properties" className="underline">
                      View on properties page →
                    </Link>
                  </p>
                  <p>
                    <Link href="/" className="underline">
                      View on homepage →
                    </Link>
                  </p>
                </div>
              )}
              {savedSlug && !publishToggle && (
                <p className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">
                  Saved as draft (not visible on site)
                </p>
              )}
            </div>
          )}
        </aside>

        {/* COLUMN 2: PREVIEW */}
        <section className="border-b border-[#333] p-6 lg:border-b-0 lg:border-r">
          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-muted">Property Preview</p>

          {!data ? (
            <div className="flex h-64 items-center justify-center border border-[#333] bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                Select an intake above or scrape a new listing
              </p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <AdminPhotoManager
                images={data.images}
                title={data.title}
                onChange={(images) => setData({ ...data, images })}
              />
              {data.listingStatus && data.listingStatus !== "For Sale" && (
                <span className="inline-block bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber">
                  {data.listingStatus}
                </span>
              )}
              <div>
                <h2 className="text-2xl text-vacayza-off-white">{data.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-vacayza-muted">{data.address}</p>
                {data.listingStatus && (
                  <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber">
                    Status: {data.listingStatus}
                  </p>
                )}
                <p className="mt-3 font-serif text-3xl text-vacayza-off-white">{formatZAR(data.price)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatPill label="Bed" value={data.bedrooms} />
                <StatPill label="Bath" value={data.bathrooms} />
                <StatPill label="Parking" value={data.parking} />
                {data.size > 0 && <StatPill label="m²" value={data.size} />}
              </div>
              {data.description && (
                <div>
                  <p className="text-sm leading-7 text-vacayza-off-white/85">{descriptionPreview}</p>
                  {data.description.length > 200 && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber"
                    >
                      {descExpanded ? "Show less" : "Expand"}
                    </button>
                  )}
                </div>
              )}
              {data.features.length > 0 && (
                <ul className="space-y-1 border-t border-[#333] pt-4">
                  {visibleFeatures.map((f) => (
                    <li key={f} className="text-xs uppercase tracking-[0.08em] text-vacayza-off-white">
                      — {f}
                    </li>
                  ))}
                  {data.features.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setFeaturesExpanded((v) => !v)}
                      className="text-[10px] uppercase tracking-[0.15em] text-vacayza-amber"
                    >
                      {featuresExpanded ? "Show less" : `+${data.features.length - 6} more`}
                    </button>
                  )}
                </ul>
              )}
            </motion.div>
          )}
        </section>

        {/* COLUMN 3: INVESTMENT DATA */}
        <section className="p-6">
          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-muted">Investment Data</p>

          {!data ? (
            <p className="text-xs uppercase tracking-[0.12em] text-vacayza-muted">Calculations appear after scrape</p>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border border-[#333] p-4">
                <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">Acquisition Cost</p>
                <DataRow label="Purchase Price" value={formatZAR(data.price)} />
                <DataRow
                  label="Transfer Duty (SARS 24/25)"
                  value={formatZAR(data.transferDuty)}
                />
                <DataRow label="Total Acquisition" value={formatZAR(data.totalAcquisitionCost)} highlight />
              </div>

              <div className="border border-[#333] p-4">
                <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">
                  Short-Term Rental Projection
                </p>
                <DataRow label="Est. Nightly Rate" value={formatZAR(data.str.nightlyRate)} />
                <DataRow label="Peak (Dec–Feb)" value={formatZAR(data.str.peakRate)} />
                <DataRow label="Low (Jun–Jul)" value={formatZAR(data.str.lowRate)} />
                <DataRow label="Occupancy" value={formatPercent(data.str.occupancyPct, 0)} />
                <DataRow label="Gross Annual" value={formatZAR(data.str.grossAnnual)} />
                <DataRow label="Net After Management (20%)" value={formatZAR(data.str.netAfterManagement)} />
                {data.str.annualRatesAndTaxes > 0 && (
                  <DataRow label="Rates & Taxes (annual)" value={`— ${formatZAR(data.str.annualRatesAndTaxes)}`} />
                )}
                {data.str.annualLevies > 0 && (
                  <DataRow label="Levies (annual)" value={`— ${formatZAR(data.str.annualLevies)}`} />
                )}
                <DataRow
                  label={`Maintenance Reserve (${formatPercent(data.str.maintenanceReservePct, 0)})`}
                  value={`— ${formatZAR(data.str.maintenanceReserve)}`}
                />
                <DataRow label="Net Annual" value={formatZAR(data.str.netAnnual)} />
                <DataRow label="Net Monthly" value={formatZAR(data.str.netMonthly)} />
                <div className="flex items-center justify-between pt-3">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">STR Yield</span>
                  <span className="text-xl text-vacayza-amber">
                    <AnimatedNumber value={data.str.yield} decimals={1} suffix="%" />
                  </span>
                </div>
                {data.str.dataSourceLabel && (
                  <p className="mt-3 font-mono text-[11px] leading-5 text-vacayza-muted">
                    {data.str.dataSourceLabel}
                  </p>
                )}
              </div>

              <div className="border border-[#333] p-4">
                <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                  Long-Term Rental Projection
                </p>
                <DataRow label="Est. Monthly Rent" value={formatZAR(data.ltr.monthlyRent)} />
                <DataRow label="Annual (×11.5mo)" value={formatZAR(data.ltr.annualRent)} />
                {data.ltr.annualRatesAndTaxes > 0 && (
                  <DataRow label="Rates & Taxes (annual)" value={`— ${formatZAR(data.ltr.annualRatesAndTaxes)}`} />
                )}
                {data.ltr.annualLevies > 0 && (
                  <DataRow label="Levies (annual)" value={`— ${formatZAR(data.ltr.annualLevies)}`} />
                )}
                <DataRow
                  label={`Maintenance Reserve (${formatPercent(data.ltr.maintenanceReservePct, 0)})`}
                  value={`— ${formatZAR(data.ltr.maintenanceReserve)}`}
                />
                <DataRow label="Net Annual" value={formatZAR(data.ltr.netAnnual)} />
                <DataRow label="Net Monthly" value={formatZAR(data.ltr.netMonthly)} />
                <div className="flex items-center justify-between pt-3">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">LTR Yield</span>
                  <span className="text-xl text-vacayza-off-white">
                    <AnimatedNumber value={data.ltr.yield} decimals={1} suffix="%" />
                  </span>
                </div>
              </div>

              {(data.recommendation === "STR" || data.recommendation === "STR-Preferred") && (
                <div className="border border-vacayza-amber p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">
                    ⟶ STR Recommended
                  </p>
                  <p className="mt-2 text-xs leading-6 text-vacayza-muted">
                    Short-term rental yields {formatPercent(data.str.yield)} vs long-term{" "}
                    {formatPercent(data.ltr.yield)}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>
    </main>
  );
}
