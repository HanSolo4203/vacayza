import type { PropertyListingData } from "../../lib/types";
import { SUBURBS } from "../../lib/market-rates";

const inputClass =
  "w-full border border-[#333] bg-black p-3 font-mono text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber";

export default function AdminListingFields({
  data,
  onChange,
  onRecalculate,
  recalculating,
}: {
  data: PropertyListingData;
  onChange: (next: PropertyListingData) => void;
  onRecalculate: () => void;
  recalculating: boolean;
}) {
  const set = <K extends keyof PropertyListingData>(key: K, value: PropertyListingData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-3 border border-[#333] p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">Edit listing</p>
      <input
        placeholder="Title"
        value={data.title}
        onChange={(e) => set("title", e.target.value)}
        className={inputClass}
      />
      <input
        placeholder="Address"
        value={data.address}
        onChange={(e) => set("address", e.target.value)}
        className={inputClass}
      />
      <select value={data.suburb} onChange={(e) => set("suburb", e.target.value)} className={inputClass}>
        {SUBURBS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <input
        placeholder="Price (R)"
        type="number"
        value={data.price || ""}
        onChange={(e) => set("price", Number(e.target.value))}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Levies / mo (R)"
          type="number"
          value={data.levies ?? ""}
          onChange={(e) => set("levies", e.target.value ? Number(e.target.value) : undefined)}
          className={inputClass}
        />
        <input
          placeholder="Rates & taxes / mo (R)"
          type="number"
          value={data.ratesAndTaxes ?? ""}
          onChange={(e) => set("ratesAndTaxes", e.target.value ? Number(e.target.value) : undefined)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          placeholder="Beds"
          type="number"
          value={data.bedrooms}
          onChange={(e) => set("bedrooms", Number(e.target.value))}
          className={inputClass}
        />
        <input
          placeholder="Baths"
          type="number"
          value={data.bathrooms}
          onChange={(e) => set("bathrooms", Number(e.target.value))}
          className={inputClass}
        />
        <input
          placeholder="Parking"
          type="number"
          value={data.parking}
          onChange={(e) => set("parking", Number(e.target.value))}
          className={inputClass}
        />
      </div>
      <textarea
        placeholder="Description"
        rows={3}
        value={data.description}
        onChange={(e) => set("description", e.target.value)}
        className={inputClass}
      />
      <button
        type="button"
        onClick={onRecalculate}
        disabled={recalculating || !data.price}
        className="w-full border border-vacayza-amber px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber disabled:opacity-50"
      >
        {recalculating ? "Recalculating..." : "Recalculate yields"}
      </button>
    </div>
  );
}
