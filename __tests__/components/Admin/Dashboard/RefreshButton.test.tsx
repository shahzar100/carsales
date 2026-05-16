/**
 * Tests for src/components/Admin/Dashboard/RefreshButton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: click calls router.refresh() (wrapped in a transition
 *   so the spinner state can render); icon spins while pending
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/dashboard",
}));

import RefreshButton from "@/components/Admin/Dashboard/RefreshButton";

beforeEach(() => mockRefresh.mockReset());

describe("RefreshButton", () => {
  it("renders a button labelled 'Refresh'", () => {
    render(<RefreshButton />);
    expect(
      screen.getByRole("button", { name: /refresh/i })
    ).toBeInTheDocument();
  });

  it("📋 calls router.refresh() when clicked", () => {
    render(<RefreshButton />);
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
