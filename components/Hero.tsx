"use client";

import { motion, type Variants } from "framer-motion";

const lines = [
  "Own A Curated",
  "Cape Town",
  "Rental Asset",
];

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.25,
    },
  },
};

const item: Variants = {
  hidden: { y: 120, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8 },
  },
};

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center border-b border-[#222] px-6 pb-16 pt-28 md:px-12">
      <div className="mx-auto w-full max-w-7xl">
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-8 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber"
        >
          — CAPE TOWN INVESTMENT PLATFORM
        </motion.p>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2 md:space-y-4">
          {lines.map((line, index) => (
            <div key={line} className="overflow-hidden">
              <motion.h1
                variants={item}
                className={`text-5xl leading-none text-vacayza-off-white md:text-8xl ${
                  index === 1 ? "italic" : ""
                }`}
              >
                {line}
              </motion.h1>
            </div>
          ))}
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-10 max-w-2xl text-sm leading-8 text-vacayza-off-white/85"
        >
          Acquire a high-performing short-term rental in South Africa&apos;s most resilient tourism market,
          managed end-to-end by local operators.
        </motion.p>
      </div>
    </section>
  );
}
