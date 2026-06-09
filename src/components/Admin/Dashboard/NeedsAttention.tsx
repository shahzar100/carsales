import React from "react";
import Link from "next/link";
import { AlertTriangle, Wrench, Eye, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import type { NeedsAttention as NeedsAttentionData } from "./types";

// ═════════════════════════════════════════════════════════════
// NeedsAttention — escalation strip for OVERDUE, unactioned bookings
// (date already passed but still `pending`). Sits above the Upcoming /
// Recent widgets so the action queue can stay purely future-facing.
// Renders nothing when there is nothing to escalate.
// ═════════════════════════════════════════════════════════════

interface NeedsAttentionProps {
  data: NeedsAttentionData;
}

const TAB_HREF: Record<"service" | "viewing", string> = {
  service: "/admin/dashboard/service",
  viewing: "/admin/dashboard/viewing",
};

/** Whole days between an appointment date string and today. */
function daysAgo(dateStr: string): string {
  const then = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(then.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - then.getTime()) / 86_400_000);
  if (diff <= 0) return "today";
  if (diff === 1) return "1 day overdue";
  return `${diff} days overdue`;
}

const NeedsAttention: React.FC<NeedsAttentionProps> = ({ data }) => {
  if (!data || data.total === 0) return null;

  const { items, total } = data;
  const hidden = total - items.length;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
      <div className="flex items-center gap-2 border-b border-amber-200 px-6 py-4">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h3 className="heading-3 text-amber-900">Needs attention</h3>
        <span className="ml-1 inline-flex items-center rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
          {total}
        </span>
        <p className="ml-auto hidden text-sm text-amber-700 sm:block">
          Overdue &amp; still pending — confirm or cancel
        </p>
      </div>

      <ul className="divide-y divide-amber-100">
        {items.map((item) => (
          <li key={item.reference}>
            <Link
              href={TAB_HREF[item.type]}
              className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-amber-100/60"
            >
              <div className="w-28 shrink-0">
                <p className="text-xs font-semibold text-amber-900">
                  {formatDate(item.date)}
                </p>
                <p className="text-[11px] font-medium text-amber-700">
                  {daysAgo(item.date)}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {item.type === "service" ? (
                    <Wrench className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                  )}
                  <p className="truncate text-sm font-medium text-gray-900">
                    {item.customer}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {item.detail || item.reference}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-amber-500" />
            </Link>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <div className="border-t border-amber-200 px-6 py-2.5 text-center text-xs font-medium text-amber-700">
          + {hidden} more need attention
        </div>
      )}
    </div>
  );
};

export default NeedsAttention;
