/**
 * Tests for the admin shell pages:
 *   src/app/(admin)/admin/login/page.tsx
 *   src/app/(admin)/admin/reset-password/page.tsx
 *   src/app/(admin)/admin/dashboard/account/page.tsx
 *   src/app/(admin)/admin/dashboard/add/page.tsx
 *   src/app/(admin)/admin/dashboard/cars/page.tsx
 *
 * Standards coverage:
 * - 🔒 Security: auth gates fire BEFORE any DB read; missing session →
 *   redirect to /admin/login (not just render-and-bounce); admin/reset-password
 *   enforces 64-hex token shape before mounting the form
 * - 📋 Functional: child component wiring (AdminForm / ResetPasswordForm /
 *   TwoFactorPanel / CarView / MainForm) gets the right props
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockGetSession = jest.fn();
const mockRedirect = jest.fn((_url: string) => {
  throw new Error("REDIRECTED");
});
const mockFindOne = jest.fn();
const mockCarsToArray = jest.fn();
const mockBookingsToArray = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
  getSession: () => mockGetSession(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/lib/models", () => ({
  getAdminUsersCollection: jest.fn(async () => ({
    findOne: (q: unknown) => mockFindOne(q),
  })),
  getCarsCollection: jest.fn(async () => ({
    find: () => ({ toArray: () => mockCarsToArray() }),
  })),
  getCarViewingBookingsCollection: jest.fn(async () => ({
    find: () => ({ toArray: () => mockBookingsToArray() }),
  })),
  serializeDocument: (d: unknown) => ({ ...(d as object) }),
}));

// Stub the heavy children — we're testing the page wrapper.
jest.mock("@/components/Admin", () => ({
  AdminForm: () => <div data-testid="admin-form" />,
}));
let resetFormProps: any = null;
jest.mock("@/components/Admin/ResetPasswordForm", () => ({
  __esModule: true,
  default: (props: { token: string }) => {
    resetFormProps = props;
    return <div data-testid="admin-reset-form" />;
  },
}));
let twoFAProps: any = null;
jest.mock("@/components/Admin/TwoFactorPanel", () => ({
  __esModule: true,
  default: (props: { initialEnabled: boolean }) => {
    twoFAProps = props;
    return <div data-testid="two-fa-panel" />;
  },
}));
let carViewProps: any = null;
jest.mock("@/components/Car/CarView", () => ({
  __esModule: true,
  default: (props: unknown) => {
    carViewProps = props;
    return <div data-testid="car-view" />;
  },
}));
jest.mock("@/components/Admin/Form/MainForm", () => ({
  __esModule: true,
  default: () => <div data-testid="main-form" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetFormProps = null;
  twoFAProps = null;
  carViewProps = null;
});

// ── admin/login ──────────────────────────────────────────────
describe("(admin)/admin/login page", () => {
  it("🔒 already-authenticated admin → redirect to /admin/dashboard", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const LoginPage = (await import("@/app/(admin)/admin/login/page")).default;
    await expect(LoginPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("📋 signed-out → renders AdminForm + 'Admin Portal' heading", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    const LoginPage = (await import("@/app/(admin)/admin/login/page")).default;
    const ui = await LoginPage();
    render(ui);
    expect(screen.getByTestId("admin-form")).toBeInTheDocument();
    expect(screen.getByText(/admin portal/i)).toBeInTheDocument();
    expect(
      screen.getByText(/authorized personnel only/i)
    ).toBeInTheDocument();
  });
});

// ── admin/reset-password ─────────────────────────────────────
describe("(admin)/admin/reset-password page", () => {
  const validToken = "f".repeat(64);

  it("🔒 missing token → invalid-link error block, NOT the form", async () => {
    const Page = (await import("@/app/(admin)/admin/reset-password/page"))
      .default;
    const ui = await Page({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.getByText(/this reset link is invalid/i)).toBeInTheDocument();
    expect(screen.queryByTestId("admin-reset-form")).not.toBeInTheDocument();
    // Back-to-sign-in link present.
    expect(screen.getByText(/back to sign in/i).closest("a")).toHaveAttribute(
      "href",
      "/admin/login"
    );
  });

  it("🔒 too-short token (not 64-hex) → error block", async () => {
    const Page = (await import("@/app/(admin)/admin/reset-password/page"))
      .default;
    const ui = await Page({
      searchParams: Promise.resolve({ token: "abc123" }),
    });
    render(ui);
    expect(screen.getByText(/this reset link is invalid/i)).toBeInTheDocument();
  });

  it("📋 valid token → ResetPasswordForm receives `token` prop", async () => {
    const Page = (await import("@/app/(admin)/admin/reset-password/page"))
      .default;
    const ui = await Page({
      searchParams: Promise.resolve({ token: validToken }),
    });
    render(ui);
    expect(screen.getByTestId("admin-reset-form")).toBeInTheDocument();
    expect(resetFormProps).toEqual({ token: validToken });
  });
});

// ── admin/dashboard/account ──────────────────────────────────
describe("(admin)/admin/dashboard/account page", () => {
  it("🔒 unauth → redirect to /admin/login before any DB read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    const Page = (await import("@/app/(admin)/admin/dashboard/account/page"))
      .default;
    await expect(Page()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("🔒 authed but user not found in DB → redirect to /admin/login", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetSession.mockResolvedValue({ username: "ghost" });
    mockFindOne.mockResolvedValue(null);
    const Page = (await import("@/app/(admin)/admin/dashboard/account/page"))
      .default;
    await expect(Page()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("📋 authed + user exists → TwoFactorPanel receives initialEnabled=true", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetSession.mockResolvedValue({ username: "alice" });
    mockFindOne.mockResolvedValue({ username: "alice", totpEnabled: true });
    const Page = (await import("@/app/(admin)/admin/dashboard/account/page"))
      .default;
    const ui = await Page();
    render(ui);
    expect(screen.getByTestId("two-fa-panel")).toBeInTheDocument();
    expect(twoFAProps).toEqual({ initialEnabled: true });
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("📋 totpEnabled missing/undefined → initialEnabled=false (defensive)", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetSession.mockResolvedValue({ username: "bob" });
    mockFindOne.mockResolvedValue({ username: "bob" });
    const Page = (await import("@/app/(admin)/admin/dashboard/account/page"))
      .default;
    const ui = await Page();
    render(ui);
    expect(twoFAProps).toEqual({ initialEnabled: false });
  });
});

// ── admin/dashboard/add ──────────────────────────────────────
describe("(admin)/admin/dashboard/add page", () => {
  it("📋 renders MainForm", async () => {
    const Page = (await import("@/app/(admin)/admin/dashboard/add/page"))
      .default;
    render(Page());
    expect(screen.getByTestId("main-form")).toBeInTheDocument();
  });
});

// ── admin/dashboard/cars ─────────────────────────────────────
describe("(admin)/admin/dashboard/cars page", () => {
  it("📋 fetches cars + bookings and threads them into CarView", async () => {
    mockCarsToArray.mockResolvedValue([
      { _id: "c1", make: "Tesla", model: "Model 3" },
      { _id: "c2", make: "BMW", model: "X5" },
    ]);
    mockBookingsToArray.mockResolvedValue([{ _id: "b1", carId: "c1" }]);

    const Page = (await import("@/app/(admin)/admin/dashboard/cars/page"))
      .default;
    const ui = await Page();
    render(ui);
    expect(screen.getByTestId("car-view")).toBeInTheDocument();
    expect(carViewProps.cars).toHaveLength(2);
    expect(carViewProps.bookings).toHaveLength(1);
    expect(carViewProps.cars[0].make).toBe("Tesla");
  });

  it("📋 empty collections → CarView receives empty arrays", async () => {
    mockCarsToArray.mockResolvedValue([]);
    mockBookingsToArray.mockResolvedValue([]);

    const Page = (await import("@/app/(admin)/admin/dashboard/cars/page"))
      .default;
    const ui = await Page();
    render(ui);
    expect(carViewProps.cars).toEqual([]);
    expect(carViewProps.bookings).toEqual([]);
  });
});
