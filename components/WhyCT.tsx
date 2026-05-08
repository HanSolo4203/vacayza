"use client";

import { motion } from "framer-motion";

const points = [
  "3.2M+ international visitors annually",
  "Rand-denominated asset, hard-currency income",
  "Year-round Airbnb demand — peak Dec–Feb + shoulder Jun–Aug",
  "Foreign nationals may purchase with no restrictions",
];

export default function WhyCT() {
  return (
    <section id="why-ct" className="relative min-h-screen border-b border-[#222] bg-vacayza-black">
      <span className="pointer-events-none absolute right-6 top-6 text-[140px] leading-none text-white/5 md:right-12 md:text-[220px]">
        03
      </span>
      <div className="grid min-h-screen md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="relative flex min-h-[380px] items-end border-b border-[#222] p-8 md:min-h-full md:border-b-0 md:border-r md:border-[#222] md:p-12"
          style={{
            background: "linear-gradient(135deg, #0A0A0A 0%, #1A1208 55%, #2A1A00 100%)",
          }}
        >
          <span className="pointer-events-none absolute left-8 top-8 font-serif text-7xl italic leading-none text-white/15 md:text-[96px]">
            Cape Town
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="flex items-center px-6 py-14 md:px-16"
        >
          <div className="w-full">
            <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— THE MARKET</p>
            <h2 className="mb-12 max-w-xl text-4xl leading-tight text-vacayza-off-white md:text-6xl">
              Africa&apos;s #1 Short-Term Rental Destination.
            </h2>
            <div className="border-t border-[#333]">
              {points.map((point) => (
                <div key={point} className="flex items-start gap-4 border-t border-[#333] py-5 first:border-t-0">
                  <span className="text-vacayza-amber">—</span>
                  <p className="text-xs uppercase leading-7 tracking-[0.08em] text-vacayza-off-white">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
