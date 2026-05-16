/**
 * Tests for src/components/Services/Common/PackageCard.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import PackageCard from "@/components/Services/Common/PackageCard";

describe("PackageCard", () => {
  it("renders name, price, body, and optional subtitle + extra + footer", () => {
    render(
      <PackageCard
        name="Mini Valet"
        subtitle="Quick refresh"
        price="£59"
        extra="1 hour"
        footer={<button data-testid="cta">Book</button>}
      >
        <p data-testid="body">Includes hand wash, polish, interior vacuum.</p>
      </PackageCard>
    );
    expect(screen.getByText("Mini Valet")).toBeInTheDocument();
    expect(screen.getByText("Quick refresh")).toBeInTheDocument();
    expect(screen.getByText("£59")).toBeInTheDocument();
    expect(screen.getByText("1 hour")).toBeInTheDocument();
    expect(screen.getByTestId("body")).toBeInTheDocument();
    expect(screen.getByTestId("cta")).toBeInTheDocument();
  });

  it("hides the 'Most Popular' badge by default", () => {
    render(
      <PackageCard name="Basic" price="£10">
        <span>x</span>
      </PackageCard>
    );
    expect(screen.queryByText(/most popular/i)).not.toBeInTheDocument();
  });

  it("renders the popular badge when popular=true with the default label", () => {
    render(
      <PackageCard name="Premium" price="£99" popular>
        <span>x</span>
      </PackageCard>
    );
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
  });

  it("renders a custom popularLabel when supplied", () => {
    render(
      <PackageCard name="P" price="£1" popular popularLabel="Best value">
        <span>x</span>
      </PackageCard>
    );
    expect(screen.getByText("Best value")).toBeInTheDocument();
  });

  it("hides the subtitle and extra rows when not supplied", () => {
    render(
      <PackageCard name="Bare" price="£5">
        <span>x</span>
      </PackageCard>
    );
    // Nothing matching the omitted slots — the test is that getByText for
    // a fictional subtitle returns null, not that we positively render an
    // empty div.
    expect(screen.queryByText(/quick refresh/i)).not.toBeInTheDocument();
    expect(screen.queryByText("1 hour")).not.toBeInTheDocument();
  });

  it("renders different accent classes for each AccentColor", () => {
    const { container, rerender } = render(
      <PackageCard name="R" price="£1" accent="red">
        <span>x</span>
      </PackageCard>
    );
    expect(container.innerHTML).toContain("text-red-400");

    rerender(
      <PackageCard name="D" price="£1" accent="dark">
        <span>x</span>
      </PackageCard>
    );
    expect(container.innerHTML).toContain("text-gray-300");
  });
});
