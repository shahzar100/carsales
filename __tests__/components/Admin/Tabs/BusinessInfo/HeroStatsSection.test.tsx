/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/HeroStatsSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders three stat cards (Vehicles/Booking/Rating)
 *   each with value+label inputs; edits merge into heroStats correctly.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroStatsSection from "@/components/Admin/Tabs/BusinessInfo/HeroStatsSection";
import type { ShopInfo } from "@/lib/interfaces";

const baseShop = {
  heroStats: {
    vehicles: { value: "500+", label: "Quality Vehicles" },
    booking: { value: "24/7", label: "Online Booking" },
    rating: { value: "4.9", label: "Customer Rating" },
  },
} as ShopInfo;

describe("HeroStatsSection", () => {
  it("📋 renders the three stat categories and their values + labels", () => {
    render(<HeroStatsSection shopInfo={baseShop} update={jest.fn()} />);

    expect(screen.getByText(/vehicles/i)).toBeInTheDocument();
    expect(screen.getByText(/^booking$/i)).toBeInTheDocument();
    expect(screen.getByText(/^rating$/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("500+")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Quality Vehicles")).toBeInTheDocument();
    expect(screen.getByDisplayValue("24/7")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Online Booking")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4.9")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Customer Rating")).toBeInTheDocument();
  });

  it("📋 updating the vehicles value preserves the rest of heroStats", () => {
    const update = jest.fn();
    render(<HeroStatsSection shopInfo={baseShop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("500+"), {
      target: { value: "750+" },
    });

    expect(update).toHaveBeenCalledWith({
      heroStats: {
        ...baseShop.heroStats,
        vehicles: { ...baseShop.heroStats!.vehicles, value: "750+" },
      },
    });
  });

  it("📋 updating the rating label preserves the rest of heroStats", () => {
    const update = jest.fn();
    render(<HeroStatsSection shopInfo={baseShop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("Customer Rating"), {
      target: { value: "Avg Review" },
    });

    expect(update).toHaveBeenCalledWith({
      heroStats: {
        ...baseShop.heroStats,
        rating: { ...baseShop.heroStats!.rating, label: "Avg Review" },
      },
    });
  });

  it("📋 displays the helper copy about homepage placement", () => {
    render(<HeroStatsSection shopInfo={baseShop} update={jest.fn()} />);
    expect(
      screen.getByText(/These stats appear on the homepage hero section/i)
    ).toBeInTheDocument();
  });
});
