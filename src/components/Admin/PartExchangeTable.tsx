"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import type { PartExchange } from "@/lib/interfaces";
import { logError } from "@/lib/utils/observability";
import Pagination from "@/components/Helpful/Pagination";

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

interface Props {
  rows: PartExchange[];
  filter: { status?: string };
  pagination: { page: number; limit: number; total: number };
}

const STATUS_OPTIONS = ["pending", "valued", "accepted", "declined"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  valued: "bg-blue-100 text-blue-800",
  accepted: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
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
 * Day 10 / Fix 10.3 — admin Part-Exchange table.
 *
 * Status transitions:
 *   pending → valued    (after admin contacts customer with an offer)
 *   valued  → accepted  (customer accepts the part-ex valuation)
 *   valued  → declined  (customer declines)
 *
 * The valuation amount itself is captured to audit metadata via a
 * browser prompt — a proper schema/UI for it lands in a follow-up.
 */
export default function PartExchangeTable({
  rows,
  filter,
  pagination,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.limit)
  );

  const updateFilter = (status: string) => {
    // Changing the filter resets to page 1 — a deep-linked page can point
    // past the end of the freshly filtered set otherwise.
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.push(`/admin/dashboard/part-exchange?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    router.push(`/admin/dashboard/part-exchange${query ? `?${query}` : ""}`);
  };

  const transition = async (
    id: string,
    status: "valued" | "accepted" | "declined",
    valuation?: number
  ) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/part-exchange", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, valuation }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Failed to update enquiry");
        return;
      }
      router.refresh();
    } catch (err) {
      logError(err, { context: "PartExchangeTable.transition", id, status });
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const markValued = (id: string) => {
    // Clear any prior validation error so a fresh attempt starts clean —
    // otherwise a stale "must be a non-negative number" lingers after a fix.
    setError(null);
    const raw = window.prompt(
      "Enter the indicative valuation (whole pounds, e.g. 4500). Leave blank to skip."
    );
    if (raw === null) return; // cancel
    const trimmed = raw.trim();
    if (!trimmed) {
      transition(id, "valued");
      return;
    }
    const parsed = Number(trimmed.replace(/[^\d]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Valuation must be a non-negative number");
      return;
    }
    transition(id, "valued", parsed);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Part-Exchange enquiries</h1>
        <p className="mt-1 text-sm text-gray-600">
          Customers asking us to value their current vehicle against a car
          on the website. Move each enquiry through pending → valued →
          accepted/declined as you contact the customer.
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
            href="/admin/dashboard/part-exchange"
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
              <th className="px-4 py-3">Their car</th>
              <th className="px-4 py-3">Interested in</th>
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
                  colSpan={7}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No enquiries match the filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const id = String(r._id);
                const busy = busyId === id;
                return (
                  <m.tr
                    key={id}
                    variants={rowVariants}
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">
                      {r.enquiryReference}
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
                      <div>
                        {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.vehicle.mileage.toLocaleString()} mi ·{" "}
                        {r.vehicle.condition}
                        {r.vehicle.registration
                          ? ` · ${r.vehicle.registration}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {r.interestedInCarLabel ?? "—"}
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
                            STATUS_STYLES[r.status] ?? STATUS_STYLES.pending
                          }`}
                        >
                          {r.status}
                        </m.span>
                      </AnimatePresence>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {r.status === "pending" && (
                          <m.button
                            type="button"
                            disabled={busy}
                            onClick={() => markValued(id)}
                            whileHover={busy ? undefined : { scale: 1.05 }}
                            whileTap={busy ? undefined : { scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 460, damping: 22 }}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Mark valued
                          </m.button>
                        )}
                        {r.status === "valued" && (
                          <>
                            <m.button
                              type="button"
                              disabled={busy}
                              onClick={() => transition(id, "accepted")}
                              whileHover={busy ? undefined : { scale: 1.05 }}
                              whileTap={busy ? undefined : { scale: 0.94 }}
                              transition={{ type: "spring", stiffness: 460, damping: 22 }}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Accept
                            </m.button>
                            <m.button
                              type="button"
                              disabled={busy}
                              onClick={() => transition(id, "declined")}
                              whileHover={busy ? undefined : { scale: 1.05 }}
                              whileTap={busy ? undefined : { scale: 0.94 }}
                              transition={{ type: "spring", stiffness: 460, damping: 22 }}
                              className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Decline
                            </m.button>
                          </>
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

      <Pagination
        currentPage={pagination.page}
        totalPages={totalPages}
        onPageChange={goToPage}
        totalItems={pagination.total}
        startIndex={(pagination.page - 1) * pagination.limit}
        endIndex={pagination.page * pagination.limit}
      />
    </div>
  );
}
