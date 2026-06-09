import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { getDashboardData } from "@/components/Admin/Dashboard/getDashboardData";
import {
  KPIGrid,
  RecentActivityTable,
  UpcomingAppointments,
  NeedsAttention,
} from "@/components/Admin/Dashboard";
import {
  LazyBookingsChart,
  LazyBookingsByDayChart,
  LazyInventoryPieChart,
  LazyPriceDistributionChart,
  LazyPopularCarsChart,
  LazyServiceTypeChart,
} from "@/components/Admin/Dashboard/LazyCharts";
import RefreshButton from "@/components/Admin/Dashboard/RefreshButton";
import UpdatedAt from "@/components/Admin/Dashboard/UpdatedAt";
import DateSelector from "@/components/Admin/Dashboard/DateSelector";
import UpcomingDateSelector from "@/components/Admin/Dashboard/UpcomingDateSelector";

interface DashboardPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    upcoming?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const params = await searchParams;

  const data = await getDashboardData({
    range: params.range,
    from: params.from,
    to: params.to,
    upcoming: params.upcoming,
  });

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title tracking-tight">Dashboard</h1>
          <p className="subtitle mt-1">
            Overview of your dealership performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* DateSelector reads useSearchParams — needs its own Suspense
              boundary so it doesn't opt the whole page into client render. */}
          <Suspense fallback={null}>
            <DateSelector />
          </Suspense>
          <UpdatedAt />
          <RefreshButton />
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────── */}
      <KPIGrid kpis={data.kpis} />

      {/* ── Main charts — bookings over time ────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LazyBookingsChart data={data.charts.bookingsByMonth} />
        <LazyBookingsByDayChart data={data.charts.bookingsByDay} />
      </div>

      {/* ── Pie / donut charts row ──────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <LazyInventoryPieChart
          data={data.charts.inventoryByFuel}
          title="Fuel Type"
          subtitle="Inventory breakdown by fuel"
        />
        <LazyInventoryPieChart
          data={data.charts.inventoryByStatus}
          title="Stock Status"
          subtitle="Inventory breakdown by status"
        />
        <LazyServiceTypeChart data={data.charts.serviceTypeBreakdown} />
      </div>

      {/* ── Bar charts row ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LazyPriceDistributionChart data={data.charts.priceDistribution} />
        <LazyPopularCarsChart data={data.charts.popularCars} />
      </div>

      {/* ── Overdue / unactioned escalation (renders only when needed) ── */}
      <NeedsAttention data={data.needsAttention} />

      {/* ── Activity tables ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingAppointments
          data={data.upcomingAppointments}
          action={
            // Reads useSearchParams — own Suspense boundary so it doesn't
            // opt the whole page into client render (mirrors DateSelector).
            <Suspense fallback={null}>
              <UpcomingDateSelector />
            </Suspense>
          }
        />
        <RecentActivityTable data={data.recentActivity} />
      </div>
    </div>
  );
}
