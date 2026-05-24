"use client";

import { motion } from "framer-motion";
import { formatZAR } from "../../lib/format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CHART_HEIGHT = 160;
const BAR_AREA_HEIGHT = 120;

function monthMultiplier(monthIndex: number): number {
  // Dec(11), Jan(0), Feb(1) = peak; Jun(5), Jul(6), Aug(7) = low
  if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) return 1.6;
  if (monthIndex >= 5 && monthIndex <= 7) return 0.7;
  return 1;
}

export default function SeasonalChart({ baseRate }: { baseRate: number }) {
  const multipliers = MONTHS.map((_, i) => monthMultiplier(i));
  const max = Math.max(...multipliers);

  return (
    <div>
      <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— SEASONAL ANALYSIS</p>
      <h3 className="mb-8 text-3xl text-vacayza-off-white md:text-4xl">Seasonal Rate Distribution</h3>
      <div className="flex gap-1 md:gap-2" style={{ height: CHART_HEIGHT }}>
        {MONTHS.map((month, i) => {
          const mult = multipliers[i];
          const barHeight = Math.max(6, Math.round((mult / max) * BAR_AREA_HEIGHT));
          const isPeak = mult >= 1.5;
          const isLow = mult <= 0.75;
          const barColor = isPeak ? "bg-vacayza-amber" : isLow ? "bg-[#333]" : "bg-[#555]";

          return (
            <div key={month} className="flex flex-1 flex-col items-center justify-end gap-2">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: barHeight }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                viewport={{ once: true }}
                className={`w-full ${barColor}`}
                title={formatZAR(Math.round(baseRate * mult))}
              />
              <span className="text-[9px] uppercase tracking-[0.05em] text-vacayza-muted md:text-[11px]">
                {month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
