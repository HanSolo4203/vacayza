"use client";

import dynamic from "next/dynamic";

const ComingSoonBackground = dynamic(
  () => import("../../components/ComingSoonBackground"),
  { ssr: false },
);

export default function ComingSoonView() {
  return (
    <main className="relative flex min-h-screen cursor-auto flex-col items-center justify-center overflow-hidden border-b border-[#222] px-6 py-24 md:px-12">
      <div className="pointer-events-none absolute inset-0 z-0">
        <ComingSoonBackground />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-vacayza-black via-vacayza-black/55 to-vacayza-black"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-2xl text-center drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)]">
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
