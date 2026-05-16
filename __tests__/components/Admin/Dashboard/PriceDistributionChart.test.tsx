/**
 * Tests for src/components/Admin/Dashboard/PriceDistributionChart.tsx
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

import PriceDistributionChart from "@/components/Admin/Dashboard/PriceDistributionChart";

describe("PriceDistributionChart", () => {
  it("renders the static heading + subtitle", () => {
    render(<PriceDistributionChart data={[]} />);
    expect(screen.getByText("Price Distribution")).toBeInTheDocument();
    expect(
      screen.getByText(/cars in each price bracket/i)
    ).toBeInTheDocument();
  });

  it("mounts the Recharts container regardless of data length", () => {
    const { rerender } = render(<PriceDistributionChart data={[]} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    rerender(
      <PriceDistributionChart
        data={[
          { range: "< £5k", count: 2 },
          { range: "£10k–£20k", count: 5 },
        ]}
      />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
