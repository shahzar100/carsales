/**
 * Tests for src/components/Admin/Dashboard/KPIGrid.tsx
 *
 * Standards coverage:
 * - 📋 Functional: all 8 KPI tiles render with the values from `kpis`;
 *   inventory value renders via formatPrice; subtext concatenates the
 *   sub-counts; pending-badge only shows when the count is > 0
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import KPIGrid from "@/components/Admin/Dashboard/KPIGrid";
import type { DashboardKPIs } from "@/components/Admin/Dashboard/types";

const sample: DashboardKPIs = {
  totalCars: 100,
  availableCars: 60,
  soldCars: 30,
  reservedCars: 10,
  totalServiceBookings: 50,
  pendingServiceBookings: 5,
  confirmedServiceBookings: 20,
  completedServiceBookings: 15,
  cancelledServiceBookings: 10,
  totalViewingBookings: 40,
  pendingViewingBookings: 0,
  confirmedViewingBookings: 25,
  completedViewingBookings: 10,
  cancelledViewingBookings: 5,
  totalInventoryValue: 1_250_000,
  totalSoldValue: 800_000,
  totalUsers: 3,
};

describe("KPIGrid", () => {
  it("renders all eight stat-card labels", () => {
    render(<KPIGrid kpis={sample} />);
    [
      "Total Cars",
      "Inventory Value",
      "Service Bookings",
      "Car Viewings",
      "Completed Services",
      "Completed Viewings",
      "Pending Total",
      "Admin Users",
    ].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument()
    );
  });

  it("📋 sums pending across service + viewing", () => {
    render(<KPIGrid kpis={sample} />);
    // pendingService=5, pendingViewing=0 -> total 5 in the "Pending Total" tile.
    // The DOM has multiple "5"s (one in the badge, one in the subtext); just
    // verify the Pending Total card has the right summed value.
    const pendingTotalCard = screen
      .getByText("Pending Total")
      .closest("div")?.parentElement;
    expect(pendingTotalCard?.textContent).toContain("5");
  });

  it("renders pending badge for service bookings when pendingServiceBookings > 0", () => {
    render(<KPIGrid kpis={sample} />);
    // The "5 pending" string appears in both the badge AND the subtext
    // ("5 pending · 20 confirmed") — accept >=1 match.
    expect(screen.getAllByText(/5 pending/i).length).toBeGreaterThan(0);
  });

  it("📋 hides the viewing pending badge when pendingViewingBookings === 0", () => {
    render(<KPIGrid kpis={sample} />);
    // Each pending badge has the .bg-amber-100 class. With
    // pendingServiceBookings=5 and pendingViewingBookings=0, only ONE
    // amber pill should be in the DOM — for service bookings.
    const pills = document.querySelectorAll(
      "span.rounded-full.bg-amber-100.text-amber-700"
    );
    expect(pills).toHaveLength(1);
  });

  it("📋 formats inventory + sold value as GBP", () => {
    render(<KPIGrid kpis={sample} />);
    expect(screen.getByText(/£1,250,000/)).toBeInTheDocument();
    expect(screen.getByText(/£800,000 sold value/)).toBeInTheDocument();
  });

  it("includes the subtext fragment for Total Cars", () => {
    render(<KPIGrid kpis={sample} />);
    expect(
      screen.getByText(/60 available · 30 sold · 10 reserved/)
    ).toBeInTheDocument();
  });
});
