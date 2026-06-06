"use client";

import { Calendar, Car, Wrench, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { m } from "motion/react";
import StatusBadge from "@/components/UI/StatusBadge";
import EmptyState from "@/components/UI/EmptyState";

/** One booking-like activity row — mirrors the API shape in
 *  /api/account/bookings. */
export interface ActivityItem {
  kind: "service" | "viewing" | "reservation";
  reference: string;
  status: string;
  date: string;
  title: string;
  subtitle?: string;
}

const KIND_ICON: Record<ActivityItem["kind"], LucideIcon> = {
  service: Wrench,
  viewing: Car,
  reservation: ClipboardList,
};

const KIND_LABEL: Record<ActivityItem["kind"], string> = {
  service: "Service",
  viewing: "Car viewing",
  reservation: "Reservation",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/**
 * Presentational list of bookings for one dashboard tab. The dashboard
 * fetches once and hands the pre-split `upcoming` / `history` arrays
 * down — this component never fetches.
 */
export default function BookingsList({
  items,
  loading,
  emptyTitle,
  emptyDescription,
}: {
  items: ActivityItem[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: React.ReactNode;
}) {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <m.ul
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {items.map((item) => {
        const Icon = KIND_ICON[item.kind];
        return (
          <m.li
            key={`${item.kind}-${item.reference}`}
            variants={itemVariants}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            whileHover={{ x: 3 }}
            className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="mt-0.5 rounded-lg bg-gray-100 p-2">
              <Icon className="h-5 w-5 text-gray-600" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  {KIND_LABEL[item.kind]}
                </span>
                <StatusBadge status={item.status} size="sm" />
              </div>
              <p className="mt-1 truncate font-semibold text-gray-900">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-sm text-gray-600">{item.subtitle}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Ref: {item.reference}
              </p>
            </div>
          </m.li>
        );
      })}
    </m.ul>
  );
}
