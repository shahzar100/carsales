/**
 * Tests for src/components/UI/PageLoader.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders nothing when isNavigating=false; shows
 *   "Loading <target>" when navigationTarget is set; generic copy when
 *   not; auto-resets the loading state ~800ms after the pathname changes
 *   so the overlay never sticks
 */
import React from "react";
import { render, screen, act } from "@testing-library/react";

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
let mockNavState = {
  isNavigating: false,
  setIsNavigating,
  navigationTarget: null as string | null,
  setNavigationTarget: jest.fn(),
};
jest.mock("@/contexts/NavigationContext", () => ({
  useNavigation: () => mockNavState,
}));

import PageLoader from "@/components/UI/PageLoader";

beforeEach(() => {
  jest.useFakeTimers();
  setIsNavigating.mockReset();
  pathnameValue = "/";
});

afterEach(() => {
  jest.useRealTimers();
});

describe("PageLoader", () => {
  it("📋 renders nothing when isNavigating=false", () => {
    mockNavState = {
      ...mockNavState,
      isNavigating: false,
      navigationTarget: null,
    };
    const { container } = render(<PageLoader />);
    expect(container.firstChild).toBeNull();
  });

  it("📋 renders the targeted-loading copy when navigationTarget is set", () => {
    mockNavState = {
      ...mockNavState,
      isNavigating: true,
      navigationTarget: "Browse Fleet",
    };
    render(<PageLoader />);
    expect(screen.getByText("Loading Browse Fleet")).toBeInTheDocument();
  });

  it("📋 renders the generic copy when navigationTarget is null", () => {
    mockNavState = {
      ...mockNavState,
      isNavigating: true,
      navigationTarget: null,
    };
    render(<PageLoader />);
    expect(
      screen.getByText(/taking you to your destination/i)
    ).toBeInTheDocument();
  });

  it("🎯 auto-resets the loading state ~800ms after a pathname change", () => {
    mockNavState = {
      ...mockNavState,
      isNavigating: true,
      navigationTarget: "Cars",
    };
    render(<PageLoader />);
    expect(setIsNavigating).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(setIsNavigating).toHaveBeenCalledWith(false);
  });
});
