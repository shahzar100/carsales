/**
 * Tests for src/app/not-found.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders 404 marker + page title, helpful body copy,
 *   and the three CTAs ("Browse our fleet", "Visit homepage",
 *   "Contact us") with correct hrefs.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

describe("not-found page", () => {
  it("renders 404 marker and page title", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /page not found/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("renders helpful body copy", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/may have moved or been removed/i)
    ).toBeInTheDocument();
  });

  it("renders Browse our fleet CTA pointing to /BrowseFleet", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /browse our fleet/i });
    expect(link).toHaveAttribute("href", "/BrowseFleet");
  });

  it("renders Visit homepage CTA pointing to /", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /visit homepage/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders Contact us CTA pointing to /contact", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /contact us/i });
    expect(link).toHaveAttribute("href", "/contact");
  });
});
