/**
 * Tests for src/components/Booking/Flow/PackageCard.tsx
 *
 * Standards coverage:
 * - 📋 Functional: package name/description/duration/price render; the
 *   "Most popular" badge only shows when `recommended` is true; the
 *   `includes` list renders one entry per item; aria-pressed mirrors the
 *   selected flag; click fires onSelect
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sparkles } from "lucide-react";
import PackageCard from "@/components/Booking/Flow/PackageCard";
import type { PackageCardData } from "@/components/Booking/Flow/PackageCard";

const basicPkg: PackageCardData = {
  id: "p1",
  name: "Express Detail",
  description: "Quick exterior wash and interior wipe-down.",
  duration: "1h",
  price: "£59",
  icon: Sparkles,
};

describe("PackageCard", () => {
  it("renders the package name, description, duration and price", () => {
    render(
      <PackageCard pkg={basicPkg} selected={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText("Express Detail")).toBeInTheDocument();
    expect(
      screen.getByText(/quick exterior wash/i)
    ).toBeInTheDocument();
    expect(screen.getByText("1h")).toBeInTheDocument();
    expect(screen.getByText("£59")).toBeInTheDocument();
  });

  it("hides the 'Most popular' badge by default", () => {
    render(
      <PackageCard pkg={basicPkg} selected={false} onSelect={jest.fn()} />
    );
    expect(screen.queryByText(/most popular/i)).not.toBeInTheDocument();
  });

  it("shows the 'Most popular' badge when recommended=true", () => {
    render(
      <PackageCard
        pkg={{ ...basicPkg, recommended: true }}
        selected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
  });

  it("renders one entry per item in the includes list", () => {
    render(
      <PackageCard
        pkg={{
          ...basicPkg,
          includes: ["Hand wax", "Tyre dressing", "Interior vacuum"],
        }}
        selected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText("Hand wax")).toBeInTheDocument();
    expect(screen.getByText("Tyre dressing")).toBeInTheDocument();
    expect(screen.getByText("Interior vacuum")).toBeInTheDocument();
  });

  it("mirrors selected state on aria-pressed and the is-selected class", () => {
    const { rerender } = render(
      <PackageCard pkg={basicPkg} selected={false} onSelect={jest.fn()} />
    );
    let btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn.className).not.toContain("is-selected");

    rerender(
      <PackageCard pkg={basicPkg} selected={true} onSelect={jest.fn()} />
    );
    btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn.className).toContain("is-selected");
  });

  it("calls onSelect when clicked", () => {
    const onSelect = jest.fn();
    render(
      <PackageCard pkg={basicPkg} selected={false} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
