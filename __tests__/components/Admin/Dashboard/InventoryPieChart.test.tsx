/**
 * Tests for src/components/Admin/Dashboard/InventoryPieChart.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders title + optional subtitle; shows the empty
 *   state when every slice has value=0; renders the Recharts container
 *   when there is data
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// recharts uses ResponsiveContainer which doesn't render in jsdom (it
// measures parent size). Mock it to a deterministic wrapper so we can
// assert children are reachable in the DOM.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

import InventoryPieChart from "@/components/Admin/Dashboard/InventoryPieChart";

describe("InventoryPieChart", () => {
  it("renders title (and optional subtitle)", () => {
    render(
      <InventoryPieChart
        title="By status"
        subtitle="Available / sold / reserved"
        data={[{ name: "available", value: 5 }]}
      />
    );
    expect(screen.getByText("By status")).toBeInTheDocument();
    expect(
      screen.getByText("Available / sold / reserved")
    ).toBeInTheDocument();
  });

  it("omits the subtitle when not supplied", () => {
    render(
      <InventoryPieChart title="By status" data={[{ name: "available", value: 5 }]} />
    );
    expect(
      screen.queryByText(/available \/ sold/i)
    ).not.toBeInTheDocument();
  });

  it("🎯 shows the 'No data available' state when every slice has value=0", () => {
    render(
      <InventoryPieChart
        title="By fuel"
        data={[
          { name: "petrol", value: 0 },
          { name: "diesel", value: 0 },
        ]}
      />
    );
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    expect(
      screen.queryByTestId("responsive-container")
    ).not.toBeInTheDocument();
  });

  it("📋 mounts the chart container when there is data", () => {
    render(
      <InventoryPieChart
        title="x"
        data={[
          { name: "a", value: 3 },
          { name: "b", value: 1 },
        ]}
      />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
