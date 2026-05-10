/**
 * Tests for the StatusBadge primitive (src/components/UI/StatusBadge.tsx).
 *
 * Standards coverage:
 * - 📋 Functional: Status mapping, capitalisation, hyphen handling
 * - 🛡️ Resilience: Unknown statuses fall back gracefully
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import StatusBadge, {
  getStatusStyles,
} from "@/components/UI/StatusBadge";

describe("StatusBadge", () => {
  it("renders the status text", () => {
    render(<StatusBadge status="available" />);
    expect(screen.getByText("available")).toBeInTheDocument();
  });

  it("uses emerald styling for available cars", () => {
    render(<StatusBadge status="available" />);
    expect(screen.getByText("available").className).toContain("bg-emerald-100");
  });

  it("uses red styling for sold cars", () => {
    render(<StatusBadge status="sold" />);
    expect(screen.getByText("sold").className).toContain("bg-red-100");
  });

  it("uses amber styling for reserved cars and pending bookings", () => {
    render(
      <>
        <StatusBadge status="reserved" />
        <StatusBadge status="pending" />
      </>
    );
    expect(screen.getByText("reserved").className).toContain("bg-amber-100");
    expect(screen.getByText("pending").className).toContain("bg-amber-100");
  });

  it("uses gray styling for completed bookings (success but historical)", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("completed").className).toContain("bg-gray-100");
  });

  it("falls back to neutral styling for unknown statuses", () => {
    render(<StatusBadge status="archived-by-user" />);
    expect(screen.getByText("archived by user").className).toContain(
      "bg-gray-100"
    );
  });

  it("replaces hyphens with spaces in the rendered label", () => {
    render(<StatusBadge status="in-stock" />);
    expect(screen.getByText("in stock")).toBeInTheDocument();
  });

  it("applies the small size when requested", () => {
    render(<StatusBadge status="available" size="sm" />);
    expect(screen.getByText("available").className).toContain("text-xs");
  });

  it("getStatusStyles returns colour classes for known and unknown inputs", () => {
    expect(getStatusStyles("available")).toContain("emerald");
    expect(getStatusStyles("sold")).toContain("red");
    expect(getStatusStyles("anything-else")).toContain("gray");
  });
});
