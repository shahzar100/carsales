import React from "react";

// ═════════════════════════════════════════════════════════════
// DashboardSkeleton — loading placeholder for the dashboard
// ═════════════════════════════════════════════════════════════

const Shimmer: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const CardSkeleton = () => (
  <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5">
    <Shimmer className="h-12 w-12 shrink-0 rounded-lg" />
    <div className="flex-1 space-y-2">
      <Shimmer className="h-3 w-24" />
      <Shimmer className="h-6 w-16" />
      <Shimmer className="h-2 w-32" />
    </div>
  </div>
);

const ChartSkeleton: React.FC<{ tall?: boolean }> = ({ tall }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6">
    <Shimmer className="mb-2 h-5 w-40" />
    <Shimmer className="mb-6 h-3 w-28" />
    <Shimmer className={tall ? "h-72" : "h-56"} />
  </div>
);

const TableSkeleton = () => (
  <div className="rounded-xl border border-gray-200 bg-white">
    <div className="border-b border-gray-100 px-6 py-4">
      <Shimmer className="h-5 w-36" />
      <Shimmer className="mt-2 h-3 w-48" />
    </div>
    <div className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="h-10 w-full" />
      ))}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* KPI cards */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>

    {/* Charts row */}
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartSkeleton tall />
      <ChartSkeleton tall />
    </div>

    {/* Pie charts */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ChartSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Tables */}
    <div className="grid gap-6 lg:grid-cols-2">
      <TableSkeleton />
      <TableSkeleton />
    </div>
  </div>
);

export default DashboardSkeleton;
