"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.55, ease: "easeOut" });
    return () => controls.stop();
  }, [motionValue, value]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}
