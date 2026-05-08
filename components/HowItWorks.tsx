"use client";

import { motion } from "framer-motion";

const steps = [
  "Tell us your budget and target yield profile.",
  "Receive curated opportunities and transparent projections.",
  "Close remotely with legal support and management onboarding.",
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-b border-[#222] bg-vacayza-black px-6 py-20 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-7xl"
      >
        <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— HOW IT WORKS</p>
        <h2 className="mb-12 max-w-3xl text-4xl leading-tight text-vacayza-off-white md:text-6xl">
          Institutional-style property selection for private investors.
        </h2>
        <div className="grid gap-0 border-t border-[#333] md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step} className="border-b border-[#333] p-6 md:border-r md:last:border-r-0">
              <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                0{idx + 1}
              </p>
              <p className="text-xs uppercase leading-7 tracking-[0.08em] text-vacayza-off-white">{step}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
