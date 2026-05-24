import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "../../../components/Footer";
import Navbar from "../../../components/Navbar";
import PropertyContactForm from "../../../components/property/PropertyContactForm";
import PropertyGallery from "../../../components/property/PropertyGallery";
import SeasonalChart from "../../../components/property/SeasonalChart";
import VacayzaScoreRing from "../../../components/property/VacayzaScoreRing";
import { formatPercent, formatSuburbLabel, formatZAR } from "../../../lib/format";
import { calculateInvestmentMetricsWithSettings } from "../../../lib/investment-server";
import { getPropertyBySlug } from "../../../lib/property-db";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Property Not Found | Vacayza" };
  return {
    title: `${property.title ?? "Property"} | Vacayza Investment`,
    description: property.description?.slice(0, 160) ?? "Cape Town investment property listing.",
  };
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#333] p-4 text-center">
      <p className="font-serif text-2xl text-vacayza-off-white md:text-3xl">{value}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-vacayza-muted">{label}</p>
    </div>
  );
}

function ProjectionRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#333] py-3 text-xs">
      <span className="uppercase tracking-[0.12em] text-vacayza-muted">{label}</span>
      <span
        className={
          bold ? "font-serif text-lg text-vacayza-amber" : muted ? "text-vacayza-muted" : "text-vacayza-off-white"
        }
      >
        {value}
      </span>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

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

  const str = metrics.str;
  const ltr = metrics.ltr;
  const images = property.images ?? [];
  const features = property.features ?? [];
  const isStrRecommended =
    property.recommendation === "STR" || property.recommendation === "STR-Preferred";
  const suburbLabel = property.suburb ? formatSuburbLabel(property.suburb) : "Cape Town";

  return (
    <main className="bg-vacayza-black">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[70vh] border-b border-[#222]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1208] via-[#0a0a0a] to-[#0a0a0a]">
          <PropertyGallery images={images} title={property.title ?? "Property"} variant="hero" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-vacayza-black via-vacayza-black/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-6 pb-28 pt-32 md:px-12 md:pb-32">
          <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">
            {property.property_type?.toUpperCase() ?? "PROPERTY"} — {suburbLabel.toUpperCase()}
            {property.listing_status && property.listing_status !== "For Sale" ? ` — ${property.listing_status.toUpperCase()}` : ""}
          </p>
          <h1 className="max-w-4xl text-4xl italic text-white md:text-6xl">{property.title}</h1>
          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-vacayza-muted">{property.address}</p>
        </div>
      </section>

      {images.length > 1 && (
        <PropertyGallery images={images} title={property.title ?? "Property"} variant="page" />
      )}

      {/* THE PROPERTY */}
      <section className="border-b border-[#222] px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[60%_40%]">
          <div>
            <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— THE PROPERTY</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatBox label="Bedrooms" value={property.bedrooms ?? "—"} />
              <StatBox label="Bathrooms" value={property.bathrooms ?? "—"} />
              <StatBox label="Parking" value={property.parking ?? "—"} />
              <StatBox label="Size" value={property.size_sqm ? `${property.size_sqm} m²` : "—"} />
            </div>
            {property.description && (
              <p className="mt-10 text-sm leading-8 text-vacayza-off-white/90">{property.description}</p>
            )}
            {features.length > 0 && (
              <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs uppercase tracking-[0.08em]">
                    <span className="text-vacayza-amber">✓</span>
                    <span className="text-vacayza-off-white">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-8">
            <div className="border border-[#333] p-6 md:p-8">
              <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">Acquisition Cost</p>
              <p className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">Purchase Price</p>
              <p className="font-serif text-4xl text-white md:text-5xl">
                {property.price ? formatZAR(property.price) : "—"}
              </p>
              <div className="mt-6 flex items-baseline justify-between border-t border-[#333] pt-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">Transfer Duty</p>
                  <p className="text-sm text-vacayza-off-white">
                    {property.transfer_duty != null ? formatZAR(property.transfer_duty) : "—"}
                  </p>
                  <p className="text-[10px] text-vacayza-muted">(SARS 2024/25)</p>
                </div>
              </div>
              <div className="mt-6 border-t border-[#333] pt-6">
                <p className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">Total Investment</p>
                <p className="font-serif text-3xl text-vacayza-amber">
                  {property.total_acquisition_cost
                    ? formatZAR(property.total_acquisition_cost)
                    : "—"}
                </p>
              </div>
            </div>

            {property.vacayza_score != null && <VacayzaScoreRing score={property.vacayza_score} />}

            <a
              href="#contact"
              className="block w-full border border-vacayza-amber px-4 py-3 text-center text-[12px] uppercase tracking-[0.2em] text-vacayza-amber transition hover:bg-vacayza-amber hover:text-black"
            >
              Request Full Investment Report
            </a>
          </div>
        </div>
      </section>

      {/* INVESTMENT PROJECTIONS */}
      {str && ltr && (
        <section className="border-b border-[#222] px-6 py-20 md:px-12">
          <div className="mx-auto max-w-7xl">
            <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">
              — RENTAL INCOME PROJECTIONS
            </p>
            <h2 className="mb-12 text-4xl text-vacayza-off-white md:text-5xl">The numbers.</h2>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="border border-[#333] p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-vacayza-off-white">Short-Term Rental</p>
                  {isStrRecommended && (
                    <span className="bg-vacayza-amber px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-black">
                      Recommended
                    </span>
                  )}
                </div>
                <ProjectionRow label="Estimated Nightly Rate" value={formatZAR(str.nightlyRate)} />
                <ProjectionRow label="Peak Season (Dec–Feb)" value={formatZAR(str.peakRate)} />
                <ProjectionRow label="Low Season (Jun–Aug)" value={formatZAR(str.lowRate)} />
                <ProjectionRow label="Annual Occupancy" value={formatPercent(str.occupancyPct, 0)} />
                <ProjectionRow label="Gross Annual Revenue" value={formatZAR(str.grossAnnual)} />
                <ProjectionRow
                  label="Management Fee (20%)"
                  value={`— ${formatZAR(str.grossAnnual - str.netAfterManagement)}`}
                  muted
                />
                <ProjectionRow
                  label="Net After Management"
                  value={formatZAR(str.netAfterManagement)}
                />
                {(str.annualRatesAndTaxes > 0 || str.annualLevies > 0) && (
                  <>
                    {str.annualRatesAndTaxes > 0 && (
                      <ProjectionRow
                        label="Rates & Taxes (annual)"
                        value={`— ${formatZAR(str.annualRatesAndTaxes)}`}
                        muted
                      />
                    )}
                    {str.annualLevies > 0 && (
                      <ProjectionRow
                        label="Levies (annual)"
                        value={`— ${formatZAR(str.annualLevies)}`}
                        muted
                      />
                    )}
                  </>
                )}
                <ProjectionRow
                  label={`Maintenance Reserve (${formatPercent(str.maintenanceReservePct, 0)})`}
                  value={`— ${formatZAR(str.maintenanceReserve)}`}
                  muted
                />
                <ProjectionRow label="Net Annual Income" value={formatZAR(str.netAnnual)} bold />
                <ProjectionRow label="Net Monthly Income" value={formatZAR(str.netMonthly)} />
                <div className="mt-4 flex items-center justify-between border-t border-[#333] pt-4">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">Net Yield</span>
                  <span className="font-serif text-4xl text-vacayza-amber">{formatPercent(str.yield)}</span>
                </div>
                {str.dataSourceLabel && (
                  <p className="mt-4 font-mono text-[11px] leading-5 text-vacayza-muted">{str.dataSourceLabel}</p>
                )}
              </div>

              <div className="border border-[#333] p-6 md:p-8">
                <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-vacayza-off-white">
                  Long-Term Rental
                </p>
                <ProjectionRow label="Estimated Monthly Rent" value={formatZAR(ltr.monthlyRent)} />
                <ProjectionRow label="Annual Income (×11.5mo)" value={formatZAR(ltr.annualRent)} />
                {(ltr.annualRatesAndTaxes > 0 || ltr.annualLevies > 0) && (
                  <>
                    {ltr.annualRatesAndTaxes > 0 && (
                      <ProjectionRow
                        label="Rates & Taxes (annual)"
                        value={`— ${formatZAR(ltr.annualRatesAndTaxes)}`}
                        muted
                      />
                    )}
                    {ltr.annualLevies > 0 && (
                      <ProjectionRow
                        label="Levies (annual)"
                        value={`— ${formatZAR(ltr.annualLevies)}`}
                        muted
                      />
                    )}
                  </>
                )}
                <ProjectionRow
                  label={`Maintenance Reserve (${formatPercent(ltr.maintenanceReservePct, 0)})`}
                  value={`— ${formatZAR(ltr.maintenanceReserve)}`}
                  muted
                />
                <ProjectionRow label="Net Annual Income" value={formatZAR(ltr.netAnnual)} bold />
                <ProjectionRow label="Net Monthly Income" value={formatZAR(ltr.netMonthly)} />
                <div className="mt-4 flex items-center justify-between border-t border-[#333] pt-4">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">Net Yield</span>
                  <span className="font-serif text-4xl text-white">{formatPercent(ltr.yield)}</span>
                </div>
              </div>
            </div>

            <p className="mt-10 text-[11px] leading-6 text-vacayza-muted">
              Projections are indicative and based on Vacayza&apos;s Cape Town STR market data. Rates, taxes, levies
              (annualised from listing figures), and a maintenance reserve are deducted from net income. Actual returns
              may vary. All figures in ZAR.
            </p>
          </div>
        </section>
      )}

      {/* SEASONAL */}
      {str && (
        <section className="border-b border-[#222] px-6 py-20 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SeasonalChart baseRate={str.nightlyRate} />
          </div>
        </section>
      )}

      {/* AGENT INSIGHT */}
      {property.agent_notes && (
        <section className="border-b border-[#222] px-6 py-20 md:px-12">
          <div className="mx-auto max-w-3xl">
            <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— AGENT INSIGHT</p>
            <h2 className="mb-8 text-4xl italic text-vacayza-off-white md:text-5xl">Our take.</h2>
            <blockquote className="border-l-2 border-vacayza-amber pl-6 text-sm leading-8 text-vacayza-off-white/90">
              {property.agent_notes}
            </blockquote>
            <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-vacayza-muted">
              Curated by the Vacayza team — Cape Town STR specialists
            </p>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" className="bg-[#0D1520] px-6 py-20 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl text-vacayza-off-white md:text-5xl">Interested in this property?</h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-8 text-vacayza-off-white/85">
            We&apos;ll walk you through the full investment case, financing options, and connect you with our
            conveyancer for a seamless purchase.
          </p>
          <PropertyContactForm propertyTitle={property.title ?? "this property"} />
          <Link
            href="/properties"
            className="mt-12 inline-block text-xs uppercase tracking-[0.2em] text-vacayza-muted hover:text-vacayza-amber"
          >
            ← All properties
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
