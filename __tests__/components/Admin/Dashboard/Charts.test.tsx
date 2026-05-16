/**
 * Tests for the remaining src/components/Admin/Dashboard/*Chart.tsx
 * Recharts wrappers: BookingsChart, BookingsByDayChart, PopularCarsChart,
 * ServiceTypeChart.
 *
 * Standards coverage:
 * - 📋 Functional: each renders its static heading + subtitle; empty-data
 *   variants (PopularCarsChart, ServiceTypeChart) surface the right copy;
 *   non-empty data mounts the ResponsiveContainer
 *
 * Recharts' ResponsiveContainer measures its parent — jsdom returns 0×0
 * so the chart children never paint. The mock below swaps it for a div
 * we can assert on; the real component is exercised in browser/E2E.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

import BookingsChart from "@/components/Admin/Dashboard/BookingsChart";
import BookingsByDayChart from "@/components/Admin/Dashboard/BookingsByDayChart";
import PopularCarsChart from "@/components/Admin/Dashboard/PopularCarsChart";
import ServiceTypeChart from "@/components/Admin/Dashboard/ServiceTypeChart";

describe("BookingsChart", () => {
  it("renders the heading + subtitle and mounts the chart container", () => {
    render(<BookingsChart data={[]} />);
    expect(screen.getByText("Bookings Over Time")).toBeInTheDocument();
    expect(screen.getByText(/last 6 months/i)).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("still mounts the chart with populated monthly data", () => {
    render(
      <BookingsChart
        data={[
          { month: "Jan", services: 5, viewings: 2 },
          { month: "Feb", services: 3, viewings: 4 },
        ]}
      />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("BookingsByDayChart", () => {
  it("renders the heading + subtitle and mounts the chart container", () => {
    render(<BookingsByDayChart data={[]} />);
    expect(screen.getByText("Bookings by Day")).toBeInTheDocument();
    expect(screen.getByText(/most popular appointment days/i)).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});

describe("PopularCarsChart", () => {
  it("🎯 shows the empty state when data is []", () => {
    render(<PopularCarsChart data={[]} />);
    expect(screen.getByText(/no viewing data yet/i)).toBeInTheDocument();
    expect(
      screen.queryByTestId("responsive-container")
    ).not.toBeInTheDocument();
  });

  it("renders the chart container when there is data", () => {
    render(
      <PopularCarsChart
        data={[
          { label: "Tesla Model 3 (2023)", count: 5 },
          { label: "BMW 320d (2022)", count: 3 },
        ]}
      />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.queryByText(/no viewing data yet/i)).not.toBeInTheDocument();
  });
});

describe("ServiceTypeChart", () => {
  it("🎯 shows the empty state when every slice has value=0", () => {
    render(
      <ServiceTypeChart
        data={[
          { name: "Detailing", value: 0 },
          { name: "Tints", value: 0 },
        ]}
      />
    );
    expect(screen.getByText(/no service data yet/i)).toBeInTheDocument();
    expect(
      screen.queryByTestId("responsive-container")
    ).not.toBeInTheDocument();
  });

  it("renders the chart when there is any non-zero data", () => {
    render(
      <ServiceTypeChart
        data={[
          { name: "Detailing", value: 5 },
          { name: "Tints", value: 2 },
        ]}
      />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
