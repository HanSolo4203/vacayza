import { getNearbyPills } from "../../lib/nearby-context";

interface NearbyContextPillsProps {
  suburb: string | null | undefined;
}

export default function NearbyContextPills({ suburb }: NearbyContextPillsProps) {
  const pills = getNearbyPills(suburb);

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {pills.map((pill) => (
        <span
          key={pill}
          className="border border-[#333] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-vacayza-off-white"
        >
          {pill}
        </span>
      ))}
    </div>
  );
}
