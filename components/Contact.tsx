"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative border-b border-[#222] bg-vacayza-black px-6 py-20 md:px-12">
      <span className="pointer-events-none absolute right-6 top-6 text-[140px] leading-none text-white/5 md:right-12 md:text-[220px]">
        04
      </span>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2"
      >
        <div className="md:pr-10">
          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— GET STARTED</p>
          <h2 className="text-5xl leading-[1.05] text-vacayza-off-white md:text-7xl">
            Ready to own
            <br />
            <span className="italic">Cape Town?</span>
          </h2>
          <p className="mt-8 max-w-lg text-sm leading-8 text-vacayza-off-white/85">
            Schedule a free consultation. We walk you through the market, your budget, and the best opportunities
            available right now.
          </p>
          <div className="mt-10 space-y-2 text-[11px] uppercase tracking-[0.18em] text-vacayza-muted">
            <p>hello@vacayza.com</p>
            <p>WhatsApp: +27 (placeholder)</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="border border-[#333] p-6 md:p-8">
          <div className="space-y-4">
            <input required placeholder="Full Name" className="w-full border border-[#333] bg-black p-3 text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none" />
            <input required type="email" placeholder="Email Address" className="w-full border border-[#333] bg-black p-3 text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none" />
            <input required placeholder="Country of Residence" className="w-full border border-[#333] bg-black p-3 text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none" />
            <select required defaultValue="" className="w-full border border-[#333] bg-black p-3 text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none">
              <option value="" disabled>
                Budget Range
              </option>
              <option>Under R2M</option>
              <option>R2M–R4M</option>
              <option>R4M–R7M</option>
              <option>R7M+</option>
            </select>
            <textarea rows={3} placeholder="Optional Message" className="w-full border border-[#333] bg-black p-3 text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none" />
            <button
              type="submit"
              className="w-full border border-vacayza-amber bg-vacayza-amber px-4 py-3 text-center text-[12px] uppercase tracking-[0.2em] text-black"
            >
              Submit
            </button>
            {submitted && (
              <p className="pt-2 text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">
                WE&apos;LL BE IN TOUCH WITHIN 24 HOURS.
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </section>
  );
}
