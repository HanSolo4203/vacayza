"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Average Occupancy", value: "72%" },
  { label: "Prime Areas", value: "Sea Point / Green Point / CBD" },
  { label: "Investor Support", value: "Acquisition + Management + Reporting" },
];

export default function StatStrip() {
  return (
    <section className="border-b border-[#222] bg-vacayza-black px-6 py-8 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto grid max-w-7xl gap-6 border-y border-[#333] py-6 md:grid-cols-3"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="pr-4 md:border-r md:border-[#222] md:last:border-r-0">
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">{stat.label}</p>
            <p className="text-xs leading-6 uppercase tracking-[0.08em] text-vacayza-off-white">{stat.value}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
