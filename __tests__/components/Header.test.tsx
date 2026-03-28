import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

// Mock child components
jest.mock("@/components/Dropdown/NavMenu", () => {
  return function MockNavMenu({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) {
    return (
      <div data-testid="nav-menu" aria-label={title}>
        {children}
      </div>
    );
  };
});

jest.mock("@/components/Dropdown/NavLink", () => {
  return function MockNavLink({
    href,
    text,
    children,
  }: {
    href: string;
    text: string;
    children?: React.ReactNode;
  }) {
    return (
      <a href={href} data-testid="nav-link">
        {text}
        {children}
      </a>
    );
  };
});

describe("Header", () => {
  it("renders the navigation element", () => {
    render(<Header />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("has correct aria-label for main navigation", () => {
    render(<Header />);
    expect(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).toBeInTheDocument();
  });

  it("renders the logo link pointing to home", () => {
    render(<Header />);
    const logoLink = screen.getByRole("link", { name: /business logo/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders nav menu", () => {
    render(<Header />);
    expect(screen.getByTestId("nav-menu")).toBeInTheDocument();
  });

  it("renders all main navigation links", () => {
    render(<Header />);
    const links = screen.getAllByTestId("nav-link");
    const linkTexts = links.map((l) => l.textContent);

    expect(linkTexts.some((t) => t?.startsWith("Browse Fleet"))).toBe(true);
    expect(linkTexts.some((t) => t?.startsWith("Services"))).toBe(true);
    expect(linkTexts).toContain("Car Parts");
    expect(linkTexts).toContain("Breakdown Recovery");
    expect(linkTexts).toContain("Accident Claims");
    expect(linkTexts).toContain("Track Booking");
    expect(linkTexts).toContain("About Us");
  });
});
