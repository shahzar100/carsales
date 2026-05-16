"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

interface CountUpProps {
  /** The raw value as displayed when static (e.g. "120+", "60s", "4.9", "0"). */
  value: string;
  /** Animation duration approximation in seconds (spring-based, this is a target). */
  durationMs?: number;
  className?: string;
}

/**
 * Animates the numeric portion of `value` from 0 → the parsed number when
 * the element scrolls into view. Non-numeric characters (prefix and
 * suffix — "£", "+", "s", etc.) are preserved verbatim so "120+" still
 * renders as "120+" at the end.
 *
 * If the value has no parseable number, we render it unchanged.
 */
export default function CountUp({ value, durationMs = 1100, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  // Split "120+" → prefix "", number 120, suffix "+". "4.9" → prefix "", number 4.9.
  const match = value.match(/^(\D*)([\d.]+)(.*)$/);
  const prefix = match?.[1] ?? "";
  const numeric = match ? parseFloat(match[2]) : NaN;
  const suffix = match?.[3] ?? "";
  const decimals = match ? (match[2].split(".")[1]?.length ?? 0) : 0;

  const mv = useMotionValue(0);
  const spring = useSpring(mv, {
    duration: durationMs,
    bounce: 0,
  });
  const [display, setDisplay] = useState<string>(
    Number.isFinite(numeric) ? "0" : value
  );

  useEffect(() => {
    if (!Number.isFinite(numeric)) return;
    if (inView) mv.set(numeric);
  }, [inView, numeric, mv]);

  useEffect(() => {
    if (!Number.isFinite(numeric)) return;
    return spring.on("change", (latest) => {
      setDisplay(latest.toFixed(decimals));
    });
  }, [spring, numeric, decimals]);

  if (!Number.isFinite(numeric)) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
