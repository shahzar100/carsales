import React from "react";
import { LucideIcon } from "lucide-react";

// ═════════════════════════════════════════════════════════════
// StatCard — single KPI tile with icon, value, label & trend
// ═════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Tailwind classes for the icon background, e.g. "bg-red-100 text-red-600" */
  colour: string;
  /** Optional sub-text shown below the value */
  subtext?: string;
  /** Optional small badge rendered next to the label */
  badge?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  colour,
  subtext,
  badge,
}) => (
  <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colour}`}
    >
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {badge}
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {subtext && (
        <p className="mt-0.5 truncate text-xs text-gray-400">{subtext}</p>
      )}
    </div>
  </div>
);

export default StatCard;
