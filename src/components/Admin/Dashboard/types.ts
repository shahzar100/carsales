// ═════════════════════════════════════════════════════════════
// Dashboard Types — shared between API route and components
// ═════════════════════════════════════════════════════════════

export interface DashboardKPIs {
  totalCars: number;
  availableCars: number;
  soldCars: number;
  reservedCars: number;
  totalServiceBookings: number;
  pendingServiceBookings: number;
  confirmedServiceBookings: number;
  completedServiceBookings: number;
  cancelledServiceBookings: number;
  totalViewingBookings: number;
  pendingViewingBookings: number;
  confirmedViewingBookings: number;
  completedViewingBookings: number;
  cancelledViewingBookings: number;
  totalInventoryValue: number;
  totalSoldValue: number;
  totalUsers: number;
}

export interface MonthlyBookingData {
  month: string;
  services: number;
  viewings: number;
}

export interface DayBookingData {
  day: string;
  count: number;
}

export interface PieSlice {
  name: string;
  value: number;
  colour?: string;
}

export interface PriceRangeData {
  range: string;
  count: number;
}

export interface PopularCarData {
  label: string;
  count: number;
}

export interface ActivityItem {
  type: "service" | "viewing";
  reference: string;
  customer: string;
  date: string;
  time: string;
  status: string;
  detail: string;
  createdAt?: string;
}

export interface DashboardCharts {
  bookingsByMonth: MonthlyBookingData[];
  bookingsByDay: DayBookingData[];
  inventoryByFuel: PieSlice[];
  inventoryByStatus: PieSlice[];
  serviceTypeBreakdown: PieSlice[];
  priceDistribution: PriceRangeData[];
  popularCars: PopularCarData[];
}

export interface DashboardData {
  kpis: DashboardKPIs;
  charts: DashboardCharts;
  recentActivity: ActivityItem[];
  upcomingAppointments: ActivityItem[];
}
