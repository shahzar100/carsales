"use client";

/**
 * Lazy-loaded chart components for the admin dashboard.
 *
 * Recharts is ~500KB — dynamically importing these components
 * keeps them out of the initial bundle and only loads them
 * when the dashboard page is rendered.
 */
import dynamic from "next/dynamic";

const ChartSkeleton = () => (
  <div className="flex h-75 items-center justify-center rounded-xl border border-gray-200 bg-white">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
  </div>
);

export const LazyBookingsChart = dynamic(
  () => import("./BookingsChart"),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyBookingsByDayChart = dynamic(
  () => import("./BookingsByDayChart"),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyInventoryPieChart = dynamic(
  () => import("./InventoryPieChart"),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyPriceDistributionChart = dynamic(
  () => import("./PriceDistributionChart"),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyPopularCarsChart = dynamic(
  () => import("./PopularCarsChart"),
  { loading: ChartSkeleton, ssr: false }
);

export const LazyServiceTypeChart = dynamic(
  () => import("./ServiceTypeChart"),
  { loading: ChartSkeleton, ssr: false }
);
