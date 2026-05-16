"use client";
import React from "react";
import { motion } from "motion/react";
import { ActivityItem } from "./types";
import { Wrench, Eye, Clock } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";

// ═════════════════════════════════════════════════════════════
// RecentActivityTable — latest bookings across all types
// ═════════════════════════════════════════════════════════════

interface RecentActivityTableProps {
  data: ActivityItem[];
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-gray-100 text-gray-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
};

const typeBadge = (type: "service" | "viewing") =>
  type === "service" ? (
    <span className="inline-flex items-center gap-1 text-red-600">
      <Wrench className="h-3.5 w-3.5" /> Service
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-gray-700">
      <Eye className="h-3.5 w-3.5" /> Viewing
    </span>
  );

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ data }) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-6 py-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-gray-400" />
        <h3 className="heading-3">Recent Activity</h3>
      </div>
      <p className="mt-1 text-sm text-gray-500">Latest bookings & viewings</p>
    </div>

    {data.length === 0 ? (
      <div className="p-8 text-center text-sm text-gray-400">
        No recent activity
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Detail</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Created</th>
            </tr>
          </thead>
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-gray-50"
          >
            {data.map((item) => (
              <motion.tr
                key={item.reference}
                variants={rowVariants}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="transition-colors hover:bg-gray-50/50"
              >
                <td className="px-6 py-3 text-xs font-medium whitespace-nowrap">
                  {typeBadge(item.type)}
                </td>
                <td className="px-6 py-3 font-mono text-xs whitespace-nowrap text-gray-600">
                  {item.reference}
                </td>
                <td className="px-6 py-3 font-medium whitespace-nowrap text-gray-900">
                  {item.customer}
                </td>
                <td className="max-w-45 truncate px-6 py-3 text-gray-500">
                  {item.detail || "—"}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                  {formatDate(item.date)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {statusBadge(item.status)}
                </td>
                <td className="px-6 py-3 text-right text-xs whitespace-nowrap text-gray-400">
                  {item.createdAt ? formatRelativeTime(item.createdAt) : "—"}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    )}
  </div>
);

export default RecentActivityTable;
