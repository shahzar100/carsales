/**
 * Tests for src/components/Booking/Flow/ServiceCard.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders name/description/duration/fromPrice; selected
 *   state reflects on aria-pressed and CSS class; per-key add-on tags
 *   (rating for detailing, warranty for tints, "Today" for repairs)
 * - 🎯 Usability: click fires onSelect
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ServiceCard, {
  SERVICES,
} from "@/components/Booking/Flow/ServiceCard";

describe("ServiceCard", () => {
  it("renders name, description, duration and fromPrice", () => {
    const detailing = SERVICES[0];
    render(
      <ServiceCard service={detailing} selected={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText(detailing.name)).toBeInTheDocument();
    expect(screen.getByText(detailing.description)).toBeInTheDocument();
    expect(screen.getByText(detailing.durationLabel)).toBeInTheDocument();
    expect(screen.getByText(detailing.fromPrice)).toBeInTheDocument();
  });

  it("reflects selected state on aria-pressed and CSS class", () => {
    const detailing = SERVICES[0];
    const { rerender } = render(
      <ServiceCard service={detailing} selected={false} onSelect={jest.fn()} />
    );
    let btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn.className).not.toContain("is-selected");

    rerender(
      <ServiceCard service={detailing} selected={true} onSelect={jest.fn()} />
    );
    btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn.className).toContain("is-selected");
  });

  it("calls onSelect when clicked", () => {
    const onSelect = jest.fn();
    render(
      <ServiceCard service={SERVICES[0]} selected={false} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows detailing-specific 4.9 rating add-on tag", () => {
    const detailing = SERVICES.find((s) => s.key === "detailing")!;
    render(
      <ServiceCard service={detailing} selected={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText(/4\.9/)).toBeInTheDocument();
  });

  it("shows the tints '5-yr warranty' add-on tag", () => {
    const tints = SERVICES.find((s) => s.key === "tints")!;
    render(
      <ServiceCard service={tints} selected={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText(/5-yr warranty/i)).toBeInTheDocument();
  });

  it("shows the repairs 'Today' add-on tag", () => {
    const repairs = SERVICES.find((s) => s.key === "repairs")!;
    render(
      <ServiceCard service={repairs} selected={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders the cap tag label from the service data", () => {
    const repairs = SERVICES.find((s) => s.key === "repairs")!;
    render(
      <ServiceCard service={repairs} selected={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText(repairs.capTagLabel)).toBeInTheDocument();
  });
});
