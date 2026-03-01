import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { getDashboardData } from "@/components/Admin/Dashboard/getDashboardData";
import {
  KPIGrid,
  BookingsChart,
  BookingsByDayChart,
  InventoryPieChart,
  PriceDistributionChart,
  PopularCarsChart,
  ServiceTypeChart,
  RecentActivityTable,
  UpcomingAppointments,
} from "@/components/Admin/Dashboard";
import RefreshButton from "@/components/Admin/Dashboard/RefreshButton";
import UpdatedAt from "@/components/Admin/Dashboard/UpdatedAt";
import DateSelector from "@/components/Admin/Dashboard/DateSelector";

interface DashboardPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin");

  const params = await searchParams;

  const data = await getDashboardData({
    range: params.range,
    from: params.from,
    to: params.to,
  });

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your dealership performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateSelector />
          <UpdatedAt />
          <RefreshButton />
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────── */}
      <KPIGrid kpis={data.kpis} />

      {/* ── Main charts — bookings over time ────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BookingsChart data={data.charts.bookingsByMonth} />
        <BookingsByDayChart data={data.charts.bookingsByDay} />
      </div>

      {/* ── Pie / donut charts row ──────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InventoryPieChart
          data={data.charts.inventoryByFuel}
          title="Fuel Type"
          subtitle="Inventory breakdown by fuel"
        />
        <InventoryPieChart
          data={data.charts.inventoryByStatus}
          title="Stock Status"
          subtitle="Inventory breakdown by status"
        />
        <ServiceTypeChart data={data.charts.serviceTypeBreakdown} />
      </div>

      {/* ── Bar charts row ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PriceDistributionChart data={data.charts.priceDistribution} />
        <PopularCarsChart data={data.charts.popularCars} />
      </div>

      {/* ── Activity tables ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingAppointments data={data.upcomingAppointments} />
        <RecentActivityTable data={data.recentActivity} />
      </div>
    </div>
  );
}
