"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.55, ease: "easeOut" });
    return () => controls.stop();
  }, [motionValue, value]);

  return (
    <motion.span>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}

function formatRand(value: number) {
  return `R${Math.round(value).toLocaleString("en-ZA")}`;
}

export default function Calculator() {
  const [rate, setRate] = useState(2500);
  const [occ, setOcc] = useState(72);
  const [purchasePrice, setPurchasePrice] = useState(3500000);

  const gross = useMemo(() => rate * (occ / 100) * 365, [rate, occ]);
  const net = useMemo(() => gross * 0.8, [gross]);
  const netYield = useMemo(() => (net / purchasePrice) * 100, [net, purchasePrice]);

  return (
    <section id="calculator" className="border-b border-[#222] bg-vacayza-black px-6 py-20 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2"
      >
        <div>
          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— RETURNS CALCULATOR</p>
          <h2 className="mb-8 text-4xl leading-tight text-vacayza-off-white md:text-6xl">
            Estimate annual net yield before you buy.
          </h2>
          <div className="space-y-8">
            <label className="block border-t border-[#333] pt-4">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                Nightly Rate (R)
              </span>
              <input
                type="range"
                min={800}
                max={6500}
                step={50}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-vacayza-amber"
              />
              <p className="mt-2 text-xs uppercase tracking-[0.08em] text-vacayza-off-white">
                {formatRand(rate)}
              </p>
            </label>
            <label className="block border-t border-[#333] pt-4">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                Occupancy (%)
              </span>
              <input
                type="range"
                min={35}
                max={95}
                step={1}
                value={occ}
                onChange={(e) => setOcc(Number(e.target.value))}
                className="w-full accent-vacayza-amber"
              />
              <p className="mt-2 text-xs uppercase tracking-[0.08em] text-vacayza-off-white">{occ}%</p>
            </label>
            <label className="block border-y border-[#333] py-4">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                Purchase Price (R)
              </span>
              <input
                type="range"
                min={1500000}
                max={10000000}
                step={50000}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full accent-vacayza-amber"
              />
              <p className="mt-2 text-xs uppercase tracking-[0.08em] text-vacayza-off-white">
                {formatRand(purchasePrice)}
              </p>
            </label>
          </div>
        </div>
        <div className="border border-[#333] p-6 md:p-10">
          <div className="space-y-6">
            <div className="border-b border-[#333] pb-4">
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                Gross Annual Income
              </p>
              <p className="text-3xl text-vacayza-off-white md:text-4xl">
                <AnimatedNumber value={gross} prefix="R" decimals={0} />
              </p>
            </div>
            <div className="border-b border-[#333] pb-4">
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">
                Net Annual Income (After 20% Management Fee)
              </p>
              <p className="text-3xl text-vacayza-off-white md:text-4xl">
                <AnimatedNumber value={net} prefix="R" decimals={0} />
              </p>
            </div>
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">Net Yield</p>
              <p className="text-4xl text-vacayza-amber md:text-5xl">
                <AnimatedNumber value={netYield} decimals={2} suffix="%" />
              </p>
            </div>
            <a
              href="#contact"
              className="mt-8 inline-block text-xs uppercase tracking-[0.2em] text-vacayza-amber transition hover:underline"
            >
              REQUEST A FULL INVESTMENT REPORT →
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
