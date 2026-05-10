/**
 * Tests for the EmptyState primitive (src/components/UI/EmptyState.tsx).
 *
 * Standards coverage:
 * - 📋 Functional: Title, description, icon, action rendering
 * - ♿ Accessibility: role=status / aria-live so assistive tech announces it
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Car } from "lucide-react";
import EmptyState from "@/components/UI/EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No cars yet" />);
    expect(screen.getByText("No cars yet")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(
      <EmptyState
        title="No cars"
        description="Add your first listing to get started."
      />
    );
    expect(
      screen.getByText("Add your first listing to get started.")
    ).toBeInTheDocument();
  });

  it("renders the icon when provided", () => {
    const { container } = render(<EmptyState icon={Car} title="No cars" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the action when provided", () => {
    render(
      <EmptyState
        title="No cars"
        action={<button>Add car</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Add car" })).toBeInTheDocument();
  });

  it("uses role=status for assistive tech", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses dashed border by default", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole("status").className).toContain("border-dashed");
  });

  it("can opt out of the dashed border", () => {
    render(<EmptyState title="Empty" dashed={false} />);
    expect(screen.getByRole("status").className).not.toContain("border-dashed");
  });
});
