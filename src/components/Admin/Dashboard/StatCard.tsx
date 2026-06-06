"use client";
import React from "react";
import { m } from "motion/react";

// ═════════════════════════════════════════════════════════════
// StatCard — single KPI tile with icon, value, label & trend
// ═════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string;
  value: string | number;
  /**
   * Rendered icon element, e.g. `<Car className="h-6 w-6" />`.
   * Was previously `icon: LucideIcon` (a component reference); Next 16
   * forbids passing function references from server → client components.
   * A React element is serialisable across the RSC boundary, so callers
   * render the icon themselves and pass the JSX.
   */
  icon: React.ReactNode;
  /** Tailwind classes for the icon background, e.g. "bg-red-100 text-red-600" */
  colour: string;
  /** Optional sub-text shown below the value */
  subtext?: string;
  /** Optional small badge rendered next to the label */
  badge?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  colour,
  subtext,
  badge,
}) => (
  <m.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ type: "spring", stiffness: 360, damping: 28 }}
    whileHover={{ y: -3 }}
    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md"
  >
    <m.div
      whileHover={{ rotate: -6, scale: 1.06 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colour}`}
    >
      {icon}
    </m.div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {badge}
      </div>
      <m.p
        key={String(value)}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-1 text-2xl font-bold text-gray-900 tabular-nums"
      >
        {value}
      </m.p>
      {subtext && (
        <p className="mt-0.5 truncate text-xs text-gray-400">{subtext}</p>
      )}
    </div>
  </m.div>
);

export default StatCard;
