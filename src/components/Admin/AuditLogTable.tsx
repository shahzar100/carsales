"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "motion/react";
import type { AuditLog } from "@/lib/interfaces";

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

interface Props {
  rows: AuditLog[];
  actors: string[];
  actions: string[];
  filter: {
    actor?: string;
    action?: string;
    targetType?: string;
  };
  nextCursor: string | null;
}

const TARGET_TYPES = [
  "car",
  "carPart",
  "user",
  "booking",
  "viewing",
  "reservation",
  "partExchange",
  "quote",
  "shop",
  "other",
];

function fmt(value: Date | string | undefined): string {
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
 * Day 10 / Fix 10.1 — audit log read view.
 *
 * Server-component table with cursor-pagination (createdAt-descending,
 * `$lt` next-page cursor). Filter dropdowns submit a plain GET so the
 * URL is shareable.
 *
 * Admin-only — the page that wraps this component already enforces it.
 */
export default function AuditLogTable({
  rows,
  actors,
  actions,
  filter,
  nextCursor,
}: Props) {
  const router = useRouter();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (filter.actor && key !== "actor") params.set("actor", filter.actor);
    if (filter.action && key !== "action") params.set("action", filter.action);
    if (filter.targetType && key !== "targetType")
      params.set("targetType", filter.targetType);
    if (value) params.set(key, value);
    router.push(`/admin/dashboard/audit?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Audit log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Every state-changing admin action. Most recent first. Admin-only.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Actor</span>
          <select
            value={filter.actor ?? ""}
            onChange={(e) => update("actor", e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
          >
            <option value="">All actors</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Action</span>
          <select
            value={filter.action ?? ""}
            onChange={(e) => update("action", e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Target</span>
          <select
            value={filter.targetType ?? ""}
            onChange={(e) => update("targetType", e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
          >
            <option value="">All targets</option>
            {TARGET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {(filter.actor || filter.action || filter.targetType) && (
          <div className="flex items-end">
            <Link
              href="/admin/dashboard/audit"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear filters
            </Link>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Metadata</th>
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
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No audit log entries match the filters.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <m.tr
                  key={`${row._id ?? i}`}
                  variants={rowVariants}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {fmt(row.createdAt)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">
                    {row.actor}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                      {row.action}
                    </code>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                    {row.targetType}
                    {row.targetId ? (
                      <span className="ml-2 text-xs text-gray-500">
                        {String(row.targetId).slice(0, 8)}…
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {row.metadata
                      ? Object.entries(row.metadata)
                          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                          .join(", ")
                      : "—"}
                  </td>
                </m.tr>
              ))
            )}
          </m.tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex justify-end">
          <Link
            href={`/admin/dashboard/audit?${new URLSearchParams({
              ...(filter.actor ? { actor: filter.actor } : {}),
              ...(filter.action ? { action: filter.action } : {}),
              ...(filter.targetType ? { targetType: filter.targetType } : {}),
              cursor: nextCursor,
            }).toString()}`}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Older entries →
          </Link>
        </div>
      )}
    </div>
  );
}
