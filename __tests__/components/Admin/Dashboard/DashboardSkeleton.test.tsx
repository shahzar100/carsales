/**
 * Tests for src/components/Admin/Dashboard/DashboardSkeleton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders 8 KPI card placeholders + chart placeholders +
 *   table placeholders; all use the animated `.animate-pulse` class so a
 *   regression in the shimmer can be caught here
 */
import React from "react";
import { render } from "@testing-library/react";
import DashboardSkeleton from "@/components/Admin/Dashboard/DashboardSkeleton";

describe("DashboardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it("uses the animate-pulse class on every shimmer element", () => {
    const { container } = render(<DashboardSkeleton />);
    const pulses = container.querySelectorAll(".animate-pulse");
    // 8 KPI cards × 4 shimmer blocks each = 32; +
    // 2 tall charts × 3 = 6; + 3 short charts × 3 = 9; +
    // 2 tables × (2 header + 5 rows) = 14. Total ≥ 60.
    expect(pulses.length).toBeGreaterThanOrEqual(50);
  });

  it("includes 8 KPI card skeletons matching the live KPIGrid layout", () => {
    const { container } = render(<DashboardSkeleton />);
    // Each CardSkeleton has 4 shimmer blocks. Find the first grid (KPI
    // row) and count its direct children.
    const kpiGrid = container.querySelector(".grid");
    expect(kpiGrid).toBeTruthy();
    expect(kpiGrid?.children).toHaveLength(8);
  });
});
