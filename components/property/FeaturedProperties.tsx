import Link from "next/link";
import { getPublishedProperties } from "../../lib/property-db";
import PropertyListingCard from "./PropertyListingCard";

export default async function FeaturedProperties() {
  const properties = await getPublishedProperties();
  if (properties.length === 0) return null;

  const featured = properties.slice(0, 4);

  return (
    <section className="border-b border-[#222] px-6 py-20 md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— LIVE LISTINGS</p>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-2xl text-4xl text-vacayza-off-white md:text-5xl">
            Curated investment opportunities.
          </h2>
          <Link
            href="/properties"
            className="shrink-0 text-xs uppercase tracking-[0.2em] text-vacayza-amber transition hover:underline"
          >
            View all properties →
          </Link>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {featured.map((property) => (
            <PropertyListingCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
