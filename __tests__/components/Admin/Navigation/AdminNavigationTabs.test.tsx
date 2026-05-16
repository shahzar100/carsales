/**
 * Tests for src/components/Admin/Navigation/AdminNavigationTabs.tsx
 *
 * Standards coverage:
 * - 📋 Functional: brand link points at /admin/dashboard; nav menu only
 *   shows when AuthContext says isLoggedIn; logout button is wired to the
 *   AuthContext logout() function
 * - 🔒 Security: the dashboard links are gated behind the same isLoggedIn
 *   flag, so a signed-out user can't even see the targets
 */
import React from "react";
import {
  render as rtlRender,
  screen,
  fireEvent,
} from "@testing-library/react";

const mockLogout = jest.fn();
const mockUseAuth = jest.fn(() => ({
  isLoggedIn: true,
  logout: mockLogout,
  login: jest.fn(),
}));
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

import AdminNavigationTabs from "@/components/Admin/Navigation/AdminNavigationTabs";
import { NavigationProvider } from "@/contexts/NavigationContext";

// NavLink children rely on the global NavigationContext.
const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

beforeEach(() => {
  mockLogout.mockReset();
});

describe("AdminNavigationTabs", () => {
  it("renders the brand link to /admin/dashboard", () => {
    render(<AdminNavigationTabs />);
    const brand = screen.getByText(/Admin/, { selector: "a" });
    expect(brand).toHaveAttribute("href", "/admin/dashboard");
  });

  it("🔒 hides the menu entirely when not logged in", () => {
    mockUseAuth.mockReturnValueOnce({
      isLoggedIn: false,
      logout: mockLogout,
      login: jest.fn(),
    });
    render(<AdminNavigationTabs />);
    // No "Admin Menu" toggle button when signed out.
    expect(
      screen.queryByRole("button", { name: /toggle menu/i })
    ).not.toBeInTheDocument();
  });

  it("📋 shows the menu toggle when logged in", () => {
    render(<AdminNavigationTabs />);
    expect(
      screen.getByRole("button", { name: /toggle menu/i })
    ).toBeInTheDocument();
  });

  it("📋 includes the Cars / Bookings / Audit log links inside the open menu", () => {
    render(<AdminNavigationTabs />);
    fireEvent.click(screen.getByRole("button", { name: /toggle menu/i }));
    expect(screen.getByText("Cars")).toBeInTheDocument();
    expect(screen.getByText("Service Bookings")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
    expect(screen.getByText("Business Info")).toBeInTheDocument();
  });

  it("clicking logout calls the AuthContext.logout()", () => {
    render(<AdminNavigationTabs />);
    fireEvent.click(screen.getByRole("button", { name: /toggle menu/i }));
    // Logout is the trailing Button with text "Logout".
    fireEvent.click(screen.getByText(/logout/i).closest("button")!);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
