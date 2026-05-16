/**
 * Tests for src/components/Services/Common/PackageGrid.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import PackageGrid from "@/components/Services/Common/PackageGrid";

describe("PackageGrid", () => {
  it("renders the title and children", () => {
    render(
      <PackageGrid title="Our Packages">
        <div data-testid="pkg-1">A</div>
        <div data-testid="pkg-2">B</div>
      </PackageGrid>
    );
    expect(screen.getByText("Our Packages")).toBeInTheDocument();
    expect(screen.getByTestId("pkg-1")).toBeInTheDocument();
    expect(screen.getByTestId("pkg-2")).toBeInTheDocument();
  });

  it("defaults to a 3-column grid", () => {
    const { container } = render(
      <PackageGrid title="x">
        <div />
      </PackageGrid>
    );
    expect(container.innerHTML).toContain("lg:grid-cols-3");
  });

  it("uses 2 columns when columns=2", () => {
    const { container } = render(
      <PackageGrid title="x" columns={2}>
        <div />
      </PackageGrid>
    );
    expect(container.innerHTML).toContain("md:grid-cols-2");
  });
});
