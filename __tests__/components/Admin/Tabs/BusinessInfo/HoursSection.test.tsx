/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/HoursSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders one input per day, edits merge into the
 *   hours object via update(), labels are capitalized, falsy values
 *   coerce to "".
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HoursSection from "@/components/Admin/Tabs/BusinessInfo/HoursSection";
import type { ShopInfo } from "@/lib/interfaces";

const baseHours = {
  monday: "9:00 AM - 6:00 PM",
  tuesday: "9:00 AM - 6:00 PM",
  wednesday: "9:00 AM - 6:00 PM",
  thursday: "9:00 AM - 6:00 PM",
  friday: "9:00 AM - 6:00 PM",
  saturday: "9:00 AM - 4:00 PM",
  sunday: "Closed",
};

const shop = {
  hours: baseHours,
} as ShopInfo;

describe("HoursSection", () => {
  it("📋 renders one labeled row per day with the current hours value", () => {
    render(<HoursSection shopInfo={shop} update={jest.fn()} />);

    expect(screen.getByText(/^monday$/i)).toBeInTheDocument();
    expect(screen.getByText(/^sunday$/i)).toBeInTheDocument();
    // Saturday + Sunday have unique values; rest collide.
    expect(screen.getByDisplayValue("9:00 AM - 4:00 PM")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Closed")).toBeInTheDocument();
    // 5 weekday inputs share the same value.
    expect(screen.getAllByDisplayValue("9:00 AM - 6:00 PM")).toHaveLength(5);
  });

  it("📋 editing the Sunday slot merges into the hours object via update()", () => {
    const update = jest.fn();
    render(<HoursSection shopInfo={shop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("Closed"), {
      target: { value: "10:00 AM - 2:00 PM" },
    });

    expect(update).toHaveBeenCalledWith({
      hours: { ...baseHours, sunday: "10:00 AM - 2:00 PM" },
    });
  });

  it("📋 editing the Saturday slot merges into the hours object via update()", () => {
    const update = jest.fn();
    render(<HoursSection shopInfo={shop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("9:00 AM - 4:00 PM"), {
      target: { value: "10:00 AM - 5:00 PM" },
    });

    expect(update).toHaveBeenCalledWith({
      hours: { ...baseHours, saturday: "10:00 AM - 5:00 PM" },
    });
  });

  it("📋 renders nothing inside when hours is missing/undefined", () => {
    const empty = { hours: undefined } as unknown as ShopInfo;
    const { container } = render(
      <HoursSection shopInfo={empty} update={jest.fn()} />
    );
    expect(container.querySelectorAll("input")).toHaveLength(0);
  });
});
