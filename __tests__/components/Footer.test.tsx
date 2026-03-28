import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";

// Mock BusinessInfoContext
const mockBusinessInfo = {
  businessName: "Test Motors",
  address: "123 Test St",
  city: "Leeds",
  state: "West Yorkshire",
  zipCode: "LS1 1AA",
  phone: "0113 123 4567",
  email: "test@motors.com",
  bookingsEmail: "bookings@motors.com",
  description: "A test car dealership",
  googleMapsUrl: "https://maps.google.com/?q=test",
  socialMedia: {
    facebook: "https://facebook.com/test",
    twitter: "https://twitter.com/test",
    instagram: "https://instagram.com/test",
  },
};

jest.mock("@/backend/BusinessInfoContext", () => ({
  useBusinessInfo: () => ({ businessInfo: mockBusinessInfo }),
}));

describe("Footer", () => {
  it("renders business name", () => {
    render(<Footer />);
    expect(screen.getByText("Test Motors")).toBeInTheDocument();
  });

  it("renders business description", () => {
    render(<Footer />);
    expect(screen.getByText("A test car dealership")).toBeInTheDocument();
  });

  it("renders contact information", () => {
    render(<Footer />);
    expect(screen.getByText("0113 123 4567")).toBeInTheDocument();
    expect(screen.getByText("test@motors.com")).toBeInTheDocument();
  });

  it("renders bookings email when different from main email", () => {
    render(<Footer />);
    expect(screen.getByText("bookings@motors.com")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Footer />);
    expect(screen.getByText("Browse Fleet")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
  });

  it("renders social media links with screen reader text", () => {
    render(<Footer />);
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("Twitter")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
  });

  it("renders copyright notice", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${year}.*Test Motors`))
    ).toBeInTheDocument();
  });

  it("renders legal links", () => {
    render(<Footer />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
  });

  it("renders null when no business info", () => {
    jest
      .spyOn(require("@/backend/BusinessInfoContext"), "useBusinessInfo")
      .mockReturnValue({ businessInfo: null });

    const { container } = render(<Footer />);
    expect(container.firstChild).toBeNull();
  });
});
