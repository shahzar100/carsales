/**
 * Tests for src/app/(admin)/admin/dashboard/shop/page.tsx
 *
 * Server component that auth-guards, then fetches the assembled ShopInfo via
 * getBusinessInfo() and hands it to the ShopSettingsClient island. The
 * PUT-edits / toast behaviour now lives in the island — see
 * __tests__/components/Admin/ShopSettingsClient.test.tsx.
 *
 * Standards coverage:
 * - 🔒 Security: unauth → redirect("/admin/login") before any data read
 * - 📋 Functional: getBusinessInfo() result threaded into the island's
 *   `initialShopInfo` prop
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockRedirect = jest.fn((_url: string) => {
  throw new Error("REDIRECTED");
});
const mockGetBusinessInfo = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));

let clientProps: any = null;
jest.mock("@/components/Admin/ShopSettingsClient", () => ({
  __esModule: true,
  default: (props: unknown) => {
    clientProps = props;
    return <div data-testid="shop-client" />;
  },
}));

import ShopSettingsPage from "@/app/(admin)/admin/dashboard/shop/page";

beforeEach(() => {
  jest.clearAllMocks();
  clientProps = null;
});

describe("(admin)/admin/dashboard/shop page", () => {
  it("🔒 unauth → redirect, no data read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(ShopSettingsPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockGetBusinessInfo).not.toHaveBeenCalled();
  });

  it("📋 authed → getBusinessInfo() threaded into the island's initialShopInfo", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const shopInfo = { businessName: "Morley Motor", phone: "0113 252 6041" };
    mockGetBusinessInfo.mockResolvedValue(shopInfo);

    const ui = await ShopSettingsPage();
    render(ui);

    expect(mockGetBusinessInfo).toHaveBeenCalledTimes(1);
    expect(clientProps.initialShopInfo).toEqual(shopInfo);
    expect(screen.getByTestId("shop-client")).toBeInTheDocument();
  });
});
