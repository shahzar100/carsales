/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/CoreInfoSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders all core fields populated from props, each
 *   input change calls update() with the matching partial.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CoreInfoSection from "@/components/Admin/Tabs/BusinessInfo/CoreInfoSection";
import type { ShopInfo } from "@/lib/interfaces";

const baseShop = {
  businessName: "MMC Leeds",
  phone: "0113 468 9292",
  email: "info@mmcleeds.co.uk",
  bookingsEmail: "bookings@mmcleeds.co.uk",
  address: "Roseville Road",
  city: "Leeds",
  state: "West Yorkshire",
  zipCode: "LS8 5DT",
  googleMapsUrl: "https://maps.google.com/?q=Leeds",
  description: "Premium car sales",
  hours: {
    monday: "9-5",
    tuesday: "9-5",
    wednesday: "9-5",
    thursday: "9-5",
    friday: "9-5",
    saturday: "9-1",
    sunday: "Closed",
  },
  updatedAt: new Date(),
} as ShopInfo;

describe("CoreInfoSection", () => {
  it("📋 renders all core text/email/address fields populated from shopInfo", () => {
    render(<CoreInfoSection shopInfo={baseShop} update={jest.fn()} />);

    expect(screen.getByDisplayValue("MMC Leeds")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0113 468 9292")).toBeInTheDocument();
    expect(screen.getByDisplayValue("info@mmcleeds.co.uk")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("bookings@mmcleeds.co.uk")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Roseville Road")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Leeds")).toBeInTheDocument();
    expect(screen.getByDisplayValue("West Yorkshire")).toBeInTheDocument();
    expect(screen.getByDisplayValue("LS8 5DT")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://maps.google.com/?q=Leeds")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Premium car sales")).toBeInTheDocument();
  });

  it("📋 editing the business name calls update() with the new value only", () => {
    const update = jest.fn();
    render(<CoreInfoSection shopInfo={baseShop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("MMC Leeds"), {
      target: { value: "New Garage" },
    });
    expect(update).toHaveBeenCalledWith({ businessName: "New Garage" });
  });

  it("📋 editing phone, email, address, city threads through update() partials", () => {
    const update = jest.fn();
    render(<CoreInfoSection shopInfo={baseShop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("0113 468 9292"), {
      target: { value: "0114 000 0000" },
    });
    fireEvent.change(screen.getByDisplayValue("info@mmcleeds.co.uk"), {
      target: { value: "hello@example.com" },
    });
    fireEvent.change(screen.getByDisplayValue("Roseville Road"), {
      target: { value: "Other Road" },
    });
    fireEvent.change(screen.getByDisplayValue("Leeds"), {
      target: { value: "Bradford" },
    });

    expect(update).toHaveBeenNthCalledWith(1, { phone: "0114 000 0000" });
    expect(update).toHaveBeenNthCalledWith(2, { email: "hello@example.com" });
    expect(update).toHaveBeenNthCalledWith(3, { address: "Other Road" });
    expect(update).toHaveBeenNthCalledWith(4, { city: "Bradford" });
  });

  it("📋 editing the description textarea calls update with description", () => {
    const update = jest.fn();
    render(<CoreInfoSection shopInfo={baseShop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("Premium car sales"), {
      target: { value: "Updated" },
    });
    expect(update).toHaveBeenCalledWith({ description: "Updated" });
  });

  it("📋 falls back to empty string for missing optional fields", () => {
    const partial = {
      ...baseShop,
      bookingsEmail: undefined,
      googleMapsUrl: undefined,
      description: undefined,
      state: "",
      zipCode: "",
    } as ShopInfo;
    render(<CoreInfoSection shopInfo={partial} update={jest.fn()} />);

    // No crashes; rendered inputs remain present and empty.
    expect(screen.getByDisplayValue("MMC Leeds")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("bookings@yourbusiness.com")
    ).toHaveValue("");
  });
});
