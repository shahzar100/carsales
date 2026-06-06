"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import type { Reservation } from "@/lib/interfaces";
import { logError } from "@/lib/utils/observability";

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

interface Props {
  rows: Reservation[];
  filter: { status?: string };
  pagination: { page: number; limit: number; total: number };
}

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "expired"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-700",
};

function fmtDate(value: Date | string | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Constructing Intl.NumberFormat is expensive; build it once at module scope.
const GBP_FORMAT = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function fmtPrice(value: number): string {
  return GBP_FORMAT.format(value);
}

/**
 * Day 10 / Fix 10.3 — admin Reservations table.
 *
 * Server-side data, client-side actions. Each row exposes the status
 * transitions that make sense from the current state (confirm a
 * pending one when the customer brings cash; cancel any non-terminal
 * one). The TTL index on `expiresAt` handles auto-expiry; this UI
 * never writes the `expired` status itself.
 */
export default function ReservationsTable({
  rows,
  filter,
  pagination,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.push(`/admin/dashboard/reservations?${params.toString()}`);
  };

  const transition = async (
    id: string,
    status: "confirmed" | "cancelled"
  ) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Failed to update reservation");
        return;
      }
      router.refresh();
    } catch (err) {
      logError(err, { context: "ReservationsTable.transition", id, status });
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reservations</h1>
        <p className="mt-1 text-sm text-gray-600">
          Customers who reserved a car online and intend to pay the deposit
          in person. Pending reservations auto-expire after 48 hours.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Status</span>
          <select
            value={filter.status ?? ""}
            onChange={(e) => updateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {filter.status && (
          <Link
            href="/admin/dashboard/reservations"
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </Link>
        )}
        <span className="ml-auto text-sm text-gray-500">
          {pagination.total} total
        </span>
      </div>

      <AnimatePresence>
        {error && (
          <m.div
            key={error}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              x: [0, -6, 6, -4, 4, -2, 0],
              transition: {
                opacity: { duration: 0.18 },
                y: { duration: 0.18 },
                height: { duration: 0.18 },
                x: { duration: 0.36, ease: "easeOut" },
              },
            }}
            exit={{ opacity: 0, y: -4, height: 0, transition: { duration: 0.15 } }}
            style={{ overflow: "hidden" }}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </m.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Car</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <m.tbody
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-gray-100 text-sm"
          >
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No reservations match the filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const id = String(r._id);
                const busy = busyId === id;
                const canConfirm = r.status === "pending";
                const canCancel =
                  r.status === "pending" || r.status === "confirmed";
                return (
                  <m.tr
                    key={id}
                    variants={rowVariants}
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">
                      {r.reservationReference}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">
                        {r.customerInfo.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.customerInfo.email} · {r.customerInfo.phone}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {r.carDetails.year} {r.carDetails.make}{" "}
                      {r.carDetails.model}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                      {fmtPrice(r.carDetails.price)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                      {fmtDate(r.expiresAt)}
                    </td>
                    <td className="px-4 py-2">
                      <AnimatePresence mode="wait" initial={false}>
                        <m.span
                          key={r.status}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ type: "spring", stiffness: 460, damping: 24 }}
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            STATUS_STYLES[r.status] ?? STATUS_STYLES.expired
                          }`}
                        >
                          {r.status}
                        </m.span>
                      </AnimatePresence>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {canConfirm && (
                          <m.button
                            type="button"
                            disabled={busy}
                            onClick={() => transition(id, "confirmed")}
                            whileHover={busy ? undefined : { scale: 1.05 }}
                            whileTap={busy ? undefined : { scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 460, damping: 22 }}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Confirm
                          </m.button>
                        )}
                        {canCancel && (
                          <m.button
                            type="button"
                            disabled={busy}
                            onClick={() => transition(id, "cancelled")}
                            whileHover={busy ? undefined : { scale: 1.05 }}
                            whileTap={busy ? undefined : { scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 460, damping: 22 }}
                            className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancel
                          </m.button>
                        )}
                      </div>
                    </td>
                  </m.tr>
                );
              })
            )}
          </m.tbody>
        </table>
      </div>
    </div>
  );
}
