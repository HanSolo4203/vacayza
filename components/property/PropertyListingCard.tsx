import Link from "next/link";
import { formatPercent, formatSuburbLabel, formatZAR } from "../../lib/format";
import type { PropertyRecord } from "../../lib/property-db";
import Property24Image from "./Property24Image";

export default function PropertyListingCard({
  property,
  strYield: strYieldOverride,
}: {
  property: PropertyRecord;
  strYield?: number;
}) {
  const image = property.images?.[0];
  const strYield = strYieldOverride ?? property.str_data?.yield ?? 0;

  return (
    <article className="border border-[#333]">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-[#1a1208] to-[#0a0a0a]">
        {image ? (
          <Property24Image src={image} alt={property.title ?? "Property"} size="hero" fill className="object-cover" />
        ) : null}
        <span className="absolute right-4 top-4 bg-vacayza-amber px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-black">
          STR {formatPercent(strYield)}
        </span>
        {property.listing_status && property.listing_status !== "For Sale" && (
          <span className="absolute left-4 top-4 bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber">
            {property.listing_status}
          </span>
        )}
      </div>
      <div className="p-6">
        {property.suburb && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-vacayza-amber">
            {formatSuburbLabel(property.suburb)}
          </span>
        )}
        <p className="mt-2 text-xs uppercase tracking-[0.1em] text-vacayza-muted">{property.address}</p>
        <p className="mt-4 font-serif text-3xl text-vacayza-off-white">
          {property.price ? formatZAR(property.price) : "—"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {property.bedrooms != null && (
            <span className="border border-[#333] px-2 py-1 text-[10px] uppercase tracking-[0.1em]">
              {property.bedrooms} Bed
            </span>
          )}
          {property.bathrooms != null && (
            <span className="border border-[#333] px-2 py-1 text-[10px] uppercase tracking-[0.1em]">
              {property.bathrooms} Bath
            </span>
          )}
          {property.size_sqm != null && property.size_sqm > 0 && (
            <span className="border border-[#333] px-2 py-1 text-[10px] uppercase tracking-[0.1em]">
              {property.size_sqm} m²
            </span>
          )}
        </div>
        <Link
          href={`/properties/${property.slug}`}
          className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-vacayza-amber transition hover:underline"
        >
          View Investment Case →
        </Link>
      </div>
    </article>
  );
}
