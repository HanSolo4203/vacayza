import type { Metadata } from "next";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import PropertyListingCard from "../../components/property/PropertyListingCard";
import { calculateInvestmentMetricsWithSettings } from "../../lib/investment-server";
import { getPublishedProperties } from "../../lib/property-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investment Properties | Vacayza",
  description: "Curated Cape Town property investment opportunities with STR yield projections.",
};

export default async function PropertiesPage() {
  const properties = await getPublishedProperties();
  const enriched = await Promise.all(
    properties.map(async (property) => {
      const metrics = await calculateInvestmentMetricsWithSettings({
        price: property.price ?? 0,
        bedrooms: property.bedrooms ?? 0,
        suburb: property.suburb ?? "cape-town-city-centre",
        levies: property.levies ?? undefined,
        ratesAndTaxes: property.rates_and_taxes ?? undefined,
        title: property.title ?? undefined,
        address: property.address ?? undefined,
        description: property.description ?? undefined,
      });
      return { property, strYield: metrics.str.yield };
    }),
  );

  return (
    <main className="bg-vacayza-black">
      <Navbar />
      <section className="border-b border-[#222] px-6 py-20 md:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— INVESTMENT PROPERTIES</p>
          <h1 className="text-4xl text-vacayza-off-white md:text-6xl">Curated opportunities.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-vacayza-off-white/85">
            Hand-picked Cape Town properties with Vacayza STR market data, acquisition costs, and yield projections.
          </p>

          {enriched.length === 0 ? (
            <p className="mt-16 border border-[#333] p-8 text-xs uppercase tracking-[0.15em] text-vacayza-muted">
              No published listings yet. Use the admin intake to publish your first property.
            </p>
          ) : (
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {enriched.map(({ property, strYield }) => (
                <PropertyListingCard key={property.id} property={property} strYield={strYield} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
