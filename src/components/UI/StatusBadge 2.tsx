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
  const style = getStatusStyles(status);
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold capitalize tracking-wide ${SIZE_CLASSES[size]} ${style} ${className}`}
    >
      {status.replace(/-/g, " ")}
    </span>
  );
};

export default StatusBadge;
