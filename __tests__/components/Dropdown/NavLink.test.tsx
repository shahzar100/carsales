/**
 * Tests for src/components/Dropdown/NavLink.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders the link with the right href + text; renders the
 *   chevron + dropdown children only when `dropdown=true`; doesn't trigger
 *   navigation state when href === current pathname (already there)
 * - 🎯 Usability: clicking a link that *changes* the page sets the
 *   NavigationContext loading flag and target, so a page-level spinner
 *   can show during route transitions
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

let pathnameValue = "/";
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => pathnameValue,
}));

const setIsNavigating = jest.fn();
const setNavigationTarget = jest.fn();
jest.mock("@/contexts/NavigationContext", () => ({
  useNavigation: () => ({
    isNavigating: false,
    setIsNavigating,
    setNavigationTarget,
    navigationTarget: null,
  }),
}));

import { Car } from "lucide-react";
import NavLink from "@/components/Dropdown/NavLink";

beforeEach(() => {
  pathnameValue = "/";
  setIsNavigating.mockReset();
  setNavigationTarget.mockReset();
});

describe("NavLink", () => {
  it("renders an anchor with href and text", () => {
    render(<NavLink href="/about" text="About us" />);
    const a = screen.getByText("About us").closest("a");
    expect(a).toHaveAttribute("href", "/about");
  });

  it("renders the leading icon when supplied", () => {
    const { container } = render(
      <NavLink href="/cars" text="Cars" icon={Car} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the dropdown chevron + children only when `dropdown` is true", () => {
    const { rerender, container } = render(
      <NavLink href="/services" text="Services" />
    );
    // No chevron in the plain case (one SVG would be the icon, but here we
    // don't pass an icon, so the count is 0).
    expect(container.querySelectorAll("svg").length).toBe(0);

    rerender(
      <NavLink href="/services" text="Services" dropdown>
        <div data-testid="dropdown-child">child</div>
      </NavLink>
    );
    expect(screen.getByTestId("dropdown-child")).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("🎯 sets the navigation loading flag + target when clicking a different route", () => {
    pathnameValue = "/";
    render(<NavLink href="/cars" text="Cars" />);
    fireEvent.click(screen.getByText("Cars"));
    expect(setIsNavigating).toHaveBeenCalledWith(true);
    expect(setNavigationTarget).toHaveBeenCalledWith("Cars");
  });

  it("does NOT toggle the loading state when clicking a link that points at the current page", () => {
    pathnameValue = "/cars";
    render(<NavLink href="/cars" text="Cars" />);
    fireEvent.click(screen.getByText("Cars"));
    expect(setIsNavigating).not.toHaveBeenCalled();
    expect(setNavigationTarget).not.toHaveBeenCalled();
  });
});
