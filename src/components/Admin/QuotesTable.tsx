"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Quote } from "@/lib/interfaces";
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
  rows: Quote[];
  filter: { status?: string };
  pagination: { page: number; limit: number; total: number };
}

const STATUS_OPTIONS = ["pending", "responded", "accepted", "expired"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  responded: "bg-blue-100 text-blue-800",
  accepted: "bg-emerald-100 text-emerald-800",
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

/**
 * Day 10 / Fix 10.3 — admin Quotes table.
 *
 * Status transitions:
 *   pending → responded   (after admin emails/calls the customer)
 *   responded → accepted  (customer accepts the quote)
 *   * → expired           (manual close on stale leads)
 *
 * The admin response itself is captured to audit metadata via a
 * browser prompt. Persisting the response on the quote document
 * lands in a follow-up alongside response templates.
 */
export default function QuotesTable({ rows, filter, pagination }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.push(`/admin/dashboard/quotes?${params.toString()}`);
  };

  const transition = async (
    id: string,
    status: "responded" | "accepted" | "expired",
    responseMessage?: string
  ) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, responseMessage }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Failed to update quote");
        return;
      }
      router.refresh();
    } catch (err) {
      logError(err, { context: "QuotesTable.transition", id, status });
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const markResponded = (id: string) => {
    const raw = window.prompt(
      "Short note about what you quoted the customer (optional)."
    );
    if (raw === null) return; // cancel
    const message = raw.trim();
    transition(id, "responded", message || undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Quote requests</h1>
        <p className="mt-1 text-sm text-gray-600">
          Customers asking for a price on a service or job. Move each row
          through pending → responded → accepted/expired as you work it.
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
            href="/admin/dashboard/quotes"
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
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-gray-100 text-sm"
          >
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No quotes match the filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const id = String(r._id);
                const busy = busyId === id;
                return (
                  <motion.tr
                    key={id}
                    variants={rowVariants}
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">
                      {r.quoteReference}
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
                      <div>{r.serviceType}</div>
                      {r.serviceDetails && (
                        <div className="max-w-xs truncate text-xs text-gray-500">
                          {r.serviceDetails}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      <div>
                        {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                      </div>
                      {r.vehicle.registration && (
                        <div className="text-xs text-gray-500">
                          {r.vehicle.registration}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={r.status}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ type: "spring", stiffness: 460, damping: 24 }}
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            STATUS_STYLES[r.status] ?? STATUS_STYLES.pending
                          }`}
                        >
                          {r.status}
                        </motion.span>
                      </AnimatePresence>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {r.status === "pending" && (
                          <motion.button
                            type="button"
                            disabled={busy}
                            onClick={() => markResponded(id)}
                            whileHover={busy ? undefined : { scale: 1.05 }}
                            whileTap={busy ? undefined : { scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 460, damping: 22 }}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Mark responded
                          </motion.button>
                        )}
                        {r.status === "responded" && (
                          <motion.button
                            type="button"
                            disabled={busy}
                            onClick={() => transition(id, "accepted")}
                            whileHover={busy ? undefined : { scale: 1.05 }}
                            whileTap={busy ? undefined : { scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 460, damping: 22 }}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Mark accepted
                          </motion.button>
                        )}
                        {r.status !== "expired" && r.status !== "accepted" && (
                          <motion.button
                            type="button"
                            disabled={busy}
                            onClick={() => transition(id, "expired")}
                            whileHover={busy ? undefined : { scale: 1.05 }}
                            whileTap={busy ? undefined : { scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 460, damping: 22 }}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Expire
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
