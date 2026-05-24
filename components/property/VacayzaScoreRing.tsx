"use client";

import { motion } from "framer-motion";

export default function VacayzaScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-vacayza-muted">Vacayza Score</p>
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#222" strokeWidth="2" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#C9903A"
            strokeWidth="2"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl text-vacayza-amber">{score}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-vacayza-muted">/10</span>
        </div>
      </div>
    </div>
  );
}
