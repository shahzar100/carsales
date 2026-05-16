/**
 * Tests for src/app/(admin)/admin/dashboard/status/page.tsx
 *
 * Standards coverage:
 * - 🔒 Security: unauth → redirect("/admin/login") before any data fetch
 * - 📋 Functional: passes the resolved `getHealthData()` into the
 *   `<StatusDashboard initialHealth>` prop
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockRedirect = jest.fn((_url: string) => {
  throw new Error("REDIRECTED");
});
const mockGetHealthData = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/components/Admin/Dashboard/Status/getHealthData", () => ({
  getHealthData: () => mockGetHealthData(),
}));
jest.mock(
  "@/components/Admin/Dashboard/Status/StatusDashboard",
  () => ({
    __esModule: true,
    default: (props: { initialHealth: unknown }) => (
      <div data-testid="status-dashboard">{JSON.stringify(props.initialHealth)}</div>
    ),
  })
);

import StatusPage from "@/app/(admin)/admin/dashboard/status/page";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("admin/dashboard/status page", () => {
  it("🔒 redirects to /admin/login when not authenticated (no fetch)", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(StatusPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockGetHealthData).not.toHaveBeenCalled();
  });

  it("📋 passes the resolved health data into StatusDashboard", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const health = { ok: true, services: [{ name: "mongodb", ok: true }] };
    mockGetHealthData.mockResolvedValue(health);

    const ui = await StatusPage();
    render(ui);

    expect(screen.getByTestId("status-dashboard").textContent).toBe(
      JSON.stringify(health)
    );
  });
});
