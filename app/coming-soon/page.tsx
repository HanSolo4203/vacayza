import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vacayza — Coming Soon",
  description:
    "Cape Town short-term rental investments. We are preparing something new—check back soon.",
  openGraph: {
    title: "Vacayza — Coming Soon",
    description: "Cape Town short-term rental investments. Opening soon.",
    type: "website",
    siteName: "Vacayza",
  },
};

export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen cursor-auto flex-col items-center justify-center border-b border-[#222] px-6 py-24 md:px-12">
      <div className="mx-auto w-full max-w-2xl text-center">
        <p className="mb-8 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">
          — Vacayza
        </p>
        <h1 className="text-4xl font-normal leading-tight text-vacayza-off-white md:text-6xl">
          Something new is <span className="italic">on the way</span>
        </h1>
        <p className="mt-8 text-sm leading-8 text-vacayza-off-white/85">
          We&apos;re putting the finishing touches on our Cape Town short-term rental investment
          experience. Leave the page bookmarked—we&apos;ll be live shortly.
        </p>
        <p className="mt-10 text-xs uppercase tracking-[0.2em] text-vacayza-muted">
          Coming soon
        </p>
      </div>
    </main>
  );
}
