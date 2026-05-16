/**
 * Tests for src/components/HeroSection.tsx
 *
 * Async server component — pulls the featured car + business info at
 * render time, then branches on whether a featured car exists.
 *
 * Standards coverage:
 * - 📋 Functional: branch with no featured car renders a single-column
 *   hero + "Browse Cars" CTA; branch with featured car renders the
 *   2-column layout with image, year/make/model, formatted price + mileage,
 *   "View Details" → /BrowseFleet/<id>, and FeaturedCarBookingButton
 * - 🎯 Usability: business-info hero stats (vehicles / booking / rating)
 *   render with both values and labels supplied by the CMS
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetFeaturedCar = jest.fn();
const mockGetBusinessInfo = jest.fn();

jest.mock("@/lib/models", () => ({
  getFeaturedCar: () => mockGetFeaturedCar(),
}));
jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));

// FeaturedCarBookingButton uses ViewingContext + Link; stub it out so we
// can render HeroSection without wiring providers.
jest.mock("@/components/UI/FeaturedCarBookingButton", () => ({
  __esModule: true,
  default: () => <button data-testid="book-cta">Book viewing</button>,
}));

import HeroSection from "@/components/HeroSection";

const baseInfo = {
  phone: "0113 468 9292",
  businessName: "Carsales",
  heroStats: {
    vehicles: { value: "200+", label: "Vehicles in stock" },
    booking: { value: "Same-day", label: "Booking turnaround" },
    rating: { value: "4.9", label: "Customer rating" },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBusinessInfo.mockResolvedValue(baseInfo);
});

describe("HeroSection", () => {
  it("📋 no featured car → renders single-column hero + 'Browse Cars' CTA", async () => {
    mockGetFeaturedCar.mockResolvedValue(null);
    const ui = await HeroSection();
    render(ui);
    expect(screen.getByText(/find your perfect car/i)).toBeInTheDocument();
    expect(screen.getByText(/book a viewing today/i)).toBeInTheDocument();
    // "Browse Cars" CTA exists (the centered variant). The 2-column-only
    // "Browse All Cars" desktop variant should NOT.
    const browseCars = screen.getByText(/browse cars/i).closest("a");
    expect(browseCars).toHaveAttribute("href", "/BrowseFleet");
    expect(screen.queryByText(/browse all cars/i)).not.toBeInTheDocument();
    // No Featured badge / no FeaturedCarBookingButton stub.
    expect(screen.queryByText(/^featured$/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("book-cta")).not.toBeInTheDocument();
  });

  it("📋 with featured car → renders 2-col hero with car details + booking button", async () => {
    mockGetFeaturedCar.mockResolvedValue({
      _id: "car-7",
      year: 2024,
      make: "BMW",
      model: "X5",
      doors: 4,
      fuel: "Diesel",
      colour: "Black",
      price: 48000,
      mileage: 7500,
      image: "/bmw-x5.webp",
    });
    const ui = await HeroSection();
    render(ui);
    // 2-col-only desktop CTA appears.
    expect(screen.getByText(/browse all cars/i)).toBeInTheDocument();
    // Year/make/model.
    expect(screen.getByText("2024 BMW X5")).toBeInTheDocument();
    // doors / fuel / colour pill.
    expect(screen.getByText(/4 Door/)).toBeInTheDocument();
    // Formatted price + mileage (defer the exact format to format util,
    // just check the digits are surfaced).
    expect(screen.getByText(/£48,000/)).toBeInTheDocument();
    expect(screen.getByText(/7,500 miles/)).toBeInTheDocument();
    // Featured badge present.
    expect(screen.getByText(/^featured$/i)).toBeInTheDocument();
    // View Details link points at the car detail page.
    const detailsLink = screen.getByText(/view details/i).closest("a");
    expect(detailsLink).toHaveAttribute("href", "/BrowseFleet/car-7");
    // FeaturedCarBookingButton stub rendered.
    expect(screen.getByTestId("book-cta")).toBeInTheDocument();
    // Featured car image src threads through.
    const img = screen.getByAltText("BMW X5");
    expect(img.getAttribute("src")).toContain("bmw-x5.webp");
  });

  it("🎯 featured car w/o image → falls back to /tesla.webp placeholder", async () => {
    mockGetFeaturedCar.mockResolvedValue({
      _id: "car-8",
      year: 2023,
      make: "Tesla",
      model: "Model 3",
      doors: 4,
      fuel: "Electric",
      colour: "White",
      price: 35000,
      mileage: 12000,
      image: "",
    });
    const ui = await HeroSection();
    render(ui);
    const img = screen.getByAltText("Tesla Model 3");
    expect(img.getAttribute("src")).toContain("tesla.webp");
  });

  it("🎯 renders heroStats values + labels from business info", async () => {
    mockGetFeaturedCar.mockResolvedValue(null);
    const ui = await HeroSection();
    render(ui);
    expect(screen.getByText("200+")).toBeInTheDocument();
    expect(screen.getByText("Vehicles in stock")).toBeInTheDocument();
    expect(screen.getByText("Same-day")).toBeInTheDocument();
    expect(screen.getByText("Booking turnaround")).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("Customer rating")).toBeInTheDocument();
  });
});
