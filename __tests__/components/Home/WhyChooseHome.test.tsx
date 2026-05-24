/**
 * Tests for src/components/Home/WhyChooseHome.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders the section heading, eyebrow, intro copy, and
 *   one feature card per FEATURES entry with the right href, title, stat
 *   and CTA; bottom rail Book a Viewing link points at /BrowseFleet
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// CountUp animates the numeric portion of each stat from 0 upward when it
// scrolls into view. Under jsdom + the IntersectionObserver shim, the
// `useInView` spring never fires its `change` listener — so the display
// state stays at the initial "0". Stub it to render the raw value.
jest.mock("@/components/Home/CountUp", () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <span>{value}</span>,
}));

import WhyChooseHome from "@/components/Home/WhyChooseHome";

describe("WhyChooseHome", () => {
  it("renders the eyebrow + headline + intro paragraph", () => {
    render(<WhyChooseHome />);
    expect(screen.getByText(/the morley difference/i)).toBeInTheDocument();
    expect(
      screen.getByText(/why choose our car/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we make car buying simple/i)
    ).toBeInTheDocument();
  });

  it("renders all four feature cards with their hrefs", () => {
    render(<WhyChooseHome />);
    const quality = screen.getByText("Quality Vehicles").closest("a");
    const booking = screen.getByText("Easy Booking").closest("a");
    const noPressure = screen.getByText("No Pressure").closest("a");
    const expert = screen.getByText("Expert Advice").closest("a");
    expect(quality).toHaveAttribute("href", "/BrowseFleet");
    expect(booking).toHaveAttribute("href", "/BrowseFleet");
    expect(noPressure).toHaveAttribute("href", "/AboutUs");
    expect(expert).toHaveAttribute("href", "/contact");
  });

  it("renders the stat + statLabel for each feature card", () => {
    render(<WhyChooseHome />);
    expect(screen.getByText("120+")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("Vehicles")).toBeInTheDocument();
    expect(screen.getByText("To book")).toBeInTheDocument();
    expect(screen.getByText("Avg rating")).toBeInTheDocument();
  });

  it("has a closing 'Book a Viewing' CTA pointing at /BrowseFleet", () => {
    render(<WhyChooseHome />);
    const cta = screen.getByText("Book a Viewing").closest("a");
    expect(cta).toHaveAttribute("href", "/BrowseFleet");
  });
});
