import { formatZAR } from "../../lib/format";
import type { PropertyRecord } from "../../lib/property-db";

export default function AdminIntakeList({
  intakes,
  selectedId,
  loading,
  onSelect,
  onNew,
}: {
  intakes: PropertyRecord[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="mb-8 border border-[#333]">
      <div className="flex items-center justify-between border-b border-[#333] px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-vacayza-muted">All intakes ({intakes.length})</p>
        <button
          type="button"
          onClick={onNew}
          className="text-[10px] uppercase tracking-[0.15em] text-vacayza-amber hover:underline"
        >
          + New
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {loading && (
          <p className="p-4 text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">Loading...</p>
        )}
        {!loading && intakes.length === 0 && (
          <p className="p-4 text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">No intakes yet</p>
        )}
        {!loading &&
          intakes.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full border-b border-[#333] px-3 py-3 text-left transition last:border-b-0 ${
                  isSelected ? "bg-vacayza-amber/10" : "hover:bg-[#111]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-[11px] uppercase tracking-[0.08em] text-vacayza-off-white">
                    {item.title || item.address || "Untitled"}
                  </p>
                  <span
                    className={`shrink-0 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] ${
                      item.published ? "bg-vacayza-amber text-black" : "border border-[#444] text-vacayza-muted"
                    }`}
                  >
                    {item.published ? "Live" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-vacayza-muted">
                  {item.price ? formatZAR(item.price) : "—"} ·{" "}
                  {new Date(item.created_at).toLocaleDateString("en-ZA")}
                </p>
              </button>
            );
          })}
      </div>
    </div>
  );
}
