import React from "react";
import { ActivityItem } from "./types";
import { Calendar, Wrench, Eye, ArrowRight } from "lucide-react";

// ═════════════════════════════════════════════════════════════
// UpcomingAppointments — compact card list of next 7 days
// ═════════════════════════════════════════════════════════════

interface UpcomingAppointmentsProps {
  data: ActivityItem[];
}

const formatDate = (d: string) => {
  if (!d) return "—";
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d === today.toISOString().split("T")[0]) return "Today";
  if (d === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatTime = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
};

const statusDot = (status: string) => {
  const colours: Record<string, string> = {
    pending: "bg-amber-400",
    confirmed: "bg-blue-400",
    completed: "bg-emerald-400",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colours[status] || "bg-gray-400"}`}
    />
  );
};

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  data,
}) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-6 py-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-400" />
        <h3 className="heading-3">Upcoming Appointments</h3>
      </div>
      <p className="mt-1 text-sm text-gray-500">Next 7 days</p>
    </div>

    {data.length === 0 ? (
      <div className="p-8 text-center text-sm text-gray-400">
        No upcoming appointments
      </div>
    ) : (
      <div className="divide-y divide-gray-50">
        {data.map((item) => (
          <div
            key={item.reference}
            className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50/50"
          >
            {/* Date column */}
            <div className="w-20 shrink-0 text-center">
              <p className="text-xs font-semibold text-gray-900">
                {formatDate(item.date)}
              </p>
              <p className="text-[11px] text-gray-400">
                {formatTime(item.time)}
              </p>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-gray-200" />

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {item.type === "service" ? (
                  <Wrench className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                ) : (
                  <Eye className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                )}
                <p className="truncate text-sm font-medium text-gray-900">
                  {item.customer}
                </p>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {item.detail || item.reference}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              {statusDot(item.status)}
              <span className="text-xs text-gray-500 capitalize">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default UpcomingAppointments;
