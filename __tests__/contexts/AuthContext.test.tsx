/**
 * Tests for AuthContext (src/contexts/AuthContext.tsx)
 *
 * Standards coverage:
 * - 📋 Functional: Auth state management, login, logout, session checking
 * - 🔒 Security: Session management, redirect on unauthenticated
 * - 🎯 Usability: Loading states, redirects
 */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthProvider, { useAuth } from "@/contexts/AuthContext";

// Mock next/navigation
const mockPush = jest.fn();
const mockPathname = jest.fn().mockReturnValue("/admin/dashboard");

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return mockPathname();
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test consumer component
const TestConsumer = () => {
  const { isLoggedIn, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">
        {isLoggedIn ? "logged-in" : "logged-out"}
      </span>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockPathname.mockReturnValue("/admin/dashboard");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("📋 Functional Standards", () => {
    it("should show loading state initially", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ isLoggedIn: true }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
    });

    it("should check session on mount and show content when authenticated", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ isLoggedIn: true }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Advance past the 500ms setTimeout in checkAuth
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("logged-in");
      });
    });

    it("should set isLoggedIn to false when session check fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      mockPathname.mockReturnValue("/admin/login");

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("logged-out");
      });
    });

    it("should call login and redirect to dashboard", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ isLoggedIn: false }),
      });
      mockPathname.mockReturnValue("/admin/login");

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByText("Login")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Login"));

      expect(mockPush).toHaveBeenCalledWith("/admin/dashboard");
    });

    it("should call logout and redirect to login page", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ isLoggedIn: true }),
      });

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("logged-in");
      });

      await user.click(screen.getByText("Logout"));

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/logout", {
        method: "POST",
      });
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    });
  });

  describe("🔒 Security Standards", () => {
    it("should redirect to login when not authenticated", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ isLoggedIn: false }),
      });
      mockPathname.mockReturnValue("/admin/dashboard");

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin/login");
      });
    });

    it("should not redirect when already on login page", async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ isLoggedIn: false }),
      });
      mockPathname.mockReturnValue("/admin/login");

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // Should show content, not redirect
      await waitFor(() => {
        expect(screen.getByTestId("status")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw when useAuth is used outside AuthProvider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        "useAuth must be used within an AuthWrapper"
      );

      consoleError.mockRestore();
    });
  });
});
