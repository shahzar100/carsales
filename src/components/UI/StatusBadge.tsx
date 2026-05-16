"use client";

/**
 * Status pill — replaces inline `getStatusColor` and `getStatusBadge`
 * helpers scattered across car list cards, admin tables, and booking
 * details. Knows about all status values used in the product:
 *
 *   - Car status:      available · sold · reserved
 *   - Booking status:  pending · confirmed · completed · cancelled
 *   - Carpart status:  in-stock · out-of-stock (use the helper props)
 *
 * The component is intentionally permissive about its input string:
 * unknown values fall back to a neutral grey badge instead of throwing,
 * so adding a new status to the database doesn't crash the dashboard.
 */

import React from "react";
import { AnimatePresence, motion } from "motion/react";

type KnownStatus =
  // Cars
  | "available"
  | "sold"
  | "reserved"
  // Bookings
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  // Generic
  | "in-stock"
  | "out-of-stock";

interface StatusBadgeProps {
  /** Status string. Unknown values render with the neutral fallback colour. */
  status: KnownStatus | (string & {});
  /** Visual size. `sm` is inline-text, `md` is the default for tables/cards. */
  size?: "sm" | "md";
  /** Optional class extension. */
  className?: string;
}

const STATUS_STYLES: Record<KnownStatus, string> = {
  available: "bg-emerald-100 text-emerald-700",
  sold: "bg-red-100 text-red-700",
  reserved: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  "in-stock": "bg-emerald-100 text-emerald-700",
  "out-of-stock": "bg-red-100 text-red-700",
};

const NEUTRAL_FALLBACK = "bg-gray-100 text-gray-700";

const SIZE_CLASSES: Record<NonNullable<StatusBadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-xs",
};

/**
 * Map a status to its background / text colour classes. Exposed so the
 * occasional dot-only indicator (status dots in compact tables) can reuse
 * the same colour map without rendering a full pill.
 */
export function getStatusStyles(status: string): string {
  return (
    STATUS_STYLES[status as KnownStatus] ?? NEUTRAL_FALLBACK
  );
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  return (
    // Re-keyed by `status` so changing the value (e.g. pending → confirmed
    // in admin) re-runs the pop-in animation instead of silently swapping.
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ type: "spring", stiffness: 460, damping: 24 }}
        className={`inline-flex items-center rounded-full font-semibold capitalize tracking-wide ${SIZE_CLASSES[size]} ${getStatusStyles(status)} ${className}`}
      >
        {status.replace(/-/g, " ")}
      </motion.span>
    </AnimatePresence>
  );
};

export default StatusBadge;
