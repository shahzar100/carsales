"use client";

import { motion } from "motion/react";
import React from "react";

/**
 * Client-side animation wrappers used by the (server-rendered) HeroSection.
 * Kept in a separate file so the hero can stay async + server-only.
 */

export function HeroFadeIn({
  children,
  delay = 0,
  className,
  y = 16,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroStatCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 360, damping: 24, delay }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/3 px-6 py-5"
    >
      {children}
    </motion.div>
  );
}
