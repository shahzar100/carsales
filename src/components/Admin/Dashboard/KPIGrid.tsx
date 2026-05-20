import React from "react";
import { DashboardKPIs } from "./types";
import StatCard from "./StatCard";
import {
  Car,
  Calendar,
  Eye,
  Users,
  PoundSterling,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

// ═════════════════════════════════════════════════════════════
// KPIGrid — top-level stat cards row
// ═════════════════════════════════════════════════════════════

interface KPIGridProps {
  kpis: DashboardKPIs;
}

const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard
      label="Total Cars"
      value={kpis.totalCars}
      icon={<Car className="h-6 w-6" />}
      colour="bg-red-100 text-red-600"
      subtext={`${kpis.availableCars} available · ${kpis.soldCars} sold · ${kpis.reservedCars} reserved`}
    />
    <StatCard
      label="Inventory Value"
      value={formatPrice(kpis.totalInventoryValue)}
      icon={<PoundSterling className="h-6 w-6" />}
      colour="bg-emerald-100 text-emerald-600"
      subtext={`${formatPrice(kpis.totalSoldValue)} sold value`}
    />
    <StatCard
      label="Service Bookings"
      value={kpis.totalServiceBookings}
      icon={<Calendar className="h-6 w-6" />}
      colour="bg-gray-100 text-gray-900"
      subtext={`${kpis.pendingServiceBookings} pending · ${kpis.confirmedServiceBookings} confirmed`}
      badge={
        kpis.pendingServiceBookings > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {kpis.pendingServiceBookings} pending
          </span>
        ) : undefined
      }
    />
    <StatCard
      label="Car Viewings"
      value={kpis.totalViewingBookings}
      icon={<Eye className="h-6 w-6" />}
      colour="bg-amber-100 text-amber-600"
      subtext={`${kpis.pendingViewingBookings} pending · ${kpis.confirmedViewingBookings} confirmed`}
      badge={
        kpis.pendingViewingBookings > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {kpis.pendingViewingBookings} pending
          </span>
        ) : undefined
      }
    />
    <StatCard
      label="Completed Services"
      value={kpis.completedServiceBookings}
      icon={<CheckCircle className="h-6 w-6" />}
      colour="bg-green-100 text-green-600"
      subtext={`${kpis.cancelledServiceBookings} cancelled`}
    />
    <StatCard
      label="Completed Viewings"
      value={kpis.completedViewingBookings}
      icon={<TrendingUp className="h-6 w-6" />}
      colour="bg-sky-100 text-sky-600"
      subtext={`${kpis.cancelledViewingBookings} cancelled`}
    />
    <StatCard
      label="Pending Total"
      value={kpis.pendingServiceBookings + kpis.pendingViewingBookings}
      icon={<Clock className="h-6 w-6" />}
      colour="bg-orange-100 text-orange-600"
      subtext="Across all booking types"
    />
    <StatCard
      label="Admin Users"
      value={kpis.totalUsers}
      icon={<Users className="h-6 w-6" />}
      colour="bg-rose-100 text-rose-600"
      subtext="Active admin accounts"
    />
  </div>
);

export default KPIGrid;
