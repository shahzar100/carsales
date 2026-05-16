/**
 * Tests for src/components/Admin/Dashboard/StatCard.tsx
 *
 * Standards coverage:
 * - 📋 Functional: label, value, subtext (optional), badge (optional), icon
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Car } from "lucide-react";
import StatCard from "@/components/Admin/Dashboard/StatCard";

describe("StatCard", () => {
  it("renders the label, value, and an icon", () => {
    const { container } = render(
      <StatCard label="Total Cars" value={42} icon={Car} colour="bg-red-100" />
    );
    expect(screen.getByText("Total Cars")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the subtext when supplied", () => {
    render(
      <StatCard
        label="X"
        value="0"
        icon={Car}
        colour="bg-red-100"
        subtext="extra info"
      />
    );
    expect(screen.getByText("extra info")).toBeInTheDocument();
  });

  it("omits the subtext element when not supplied", () => {
    render(<StatCard label="X" value="0" icon={Car} colour="bg-red-100" />);
    expect(screen.queryByText("extra info")).not.toBeInTheDocument();
  });

  it("renders the badge node alongside the label when supplied", () => {
    render(
      <StatCard
        label="Pending"
        value={5}
        icon={Car}
        colour="bg-amber-100"
        badge={<span data-testid="badge">⚠</span>}
      />
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("accepts a number or a string for value", () => {
    const { rerender } = render(
      <StatCard label="x" value={100} icon={Car} colour="bg-red-100" />
    );
    expect(screen.getByText("100")).toBeInTheDocument();
    rerender(
      <StatCard label="x" value="£100,000" icon={Car} colour="bg-red-100" />
    );
    expect(screen.getByText("£100,000")).toBeInTheDocument();
  });
});
