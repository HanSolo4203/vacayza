"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Vacayza found us a Sea Point apartment. The income report was exact. We bought within five weeks.",
    author: "Sarah M.",
    country: "United Kingdom",
  },
  {
    quote:
      "As Australians buying overseas, we were cautious. They made it completely transparent. Monthly income lands without us thinking about it.",
    author: "James K.",
    country: "Australia",
  },
  {
    quote:
      "The numbers they showed us were conservative — our actual yield has been higher. Remarkable service.",
    author: "Helena V.",
    country: "Germany",
  },
];

export default function Testimonials() {
  return (
    <section className="border-b border-[#222] bg-vacayza-black px-6 py-20 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-7xl"
      >
        <p className="mb-8 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— INVESTOR STORIES</p>
        <div className="grid gap-8 md:grid-cols-3 md:gap-0">
          {testimonials.map((item, idx) => (
            <article key={item.author} className={`md:px-6 ${idx < 2 ? "md:border-r md:border-[#222]" : ""}`}>
              <p className="mb-4 text-5xl leading-none text-vacayza-amber">“</p>
              <p className="mb-8 text-sm leading-[1.9] text-vacayza-off-white">{item.quote}</p>
              <div className="border-t border-[#333] pt-4 text-[11px] uppercase tracking-[0.15em] text-vacayza-muted">
                {item.author}, {item.country}
              </div>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
