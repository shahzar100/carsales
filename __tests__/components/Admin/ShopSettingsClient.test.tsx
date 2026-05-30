/**
 * Tests for src/components/Admin/ShopSettingsClient.tsx
 *
 * Client island for the shop / business-settings page. Receives the assembled
 * ShopInfo from the server component as `initialShopInfo`, hands it to
 * BusinessInfoForm, and PUTs edits back to /api/admin/shop — surfacing the
 * result as a toast. The initial GET/loading path now lives in the server
 * page (see __tests__/app/admin/dashboard/shop.page.test.tsx), so the form is
 * present on first paint with no round-trip.
 *
 * Standards coverage:
 * - 📋 Functional: first paint mounts the form from `initialShopInfo` with no
 *   GET; PUT body matches the shopInfo; success → "Settings Updated"; per-status
 *   toast title (400 → "Validation Error", 401 → "Unauthorized", else →
 *   "Update Failed")
 * - 🎯 Usability: network reject on PUT → "Network Error" toast with the JS msg
 */
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import type { ShopInfo } from "@/lib/interfaces";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const stableToast = {
  success: mockToastSuccess,
  error: mockToastError,
  info: jest.fn(),
  warning: jest.fn(),
};
jest.mock("@/hooks/useToast", () => ({
  useToast: () => stableToast,
}));

// Capture the props the form receives + drive `onSave` via a submit.
let formProps: any = null;
jest.mock("@/components/Admin/Tabs/BusinessInfoForm", () => ({
  __esModule: true,
  default: (props: unknown) => {
    formProps = props;
    return (
      <form
        data-testid="business-form"
        onSubmit={(e) => (props as any).onSave(e)}
      >
        <button type="submit">Save</button>
      </form>
    );
  },
}));

import ShopSettingsClient from "@/components/Admin/ShopSettingsClient";

const goodShop = {
  businessName: "Morley Motor",
  phone: "0113 252 6041",
  email: "hello@morley.test",
} as unknown as ShopInfo;

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  formProps = null;
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

async function renderAndSave() {
  render(<ShopSettingsClient initialShopInfo={goodShop} />);
  // First paint already shows the form — no spinner, no GET round-trip.
  expect(screen.getByTestId("business-form")).toBeInTheDocument();
  expect(formProps.shopInfo).toEqual(goodShop);
  await act(async () => {
    fireEvent.submit(screen.getByTestId("business-form"));
  });
}

describe("ShopSettingsClient", () => {
  it("📋 mounts the form from initialShopInfo with no GET round-trip", () => {
    render(<ShopSettingsClient initialShopInfo={goodShop} />);
    expect(screen.getByTestId("business-form")).toBeInTheDocument();
    expect(formProps.shopInfo).toEqual(goodShop);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("📋 PUT success → 'Settings Updated' toast + body matches shopInfo", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    await renderAndSave();

    const putCall = fetchMock.mock.calls.find((c) => c[1]?.method === "PUT");
    expect(putCall).toBeDefined();
    expect(putCall![0]).toBe("/api/admin/shop");
    expect(putCall![1].body).toBe(JSON.stringify(goodShop));
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Settings Updated",
        "Business information has been updated successfully"
      )
    );
  });

  it("🎯 PUT 400 → 'Validation Error' toast title", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "phone is required" }),
    });
    await renderAndSave();
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Validation Error",
        "phone is required"
      )
    );
  });

  it("🔒 PUT 401 → 'Unauthorized' toast title", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Session expired" }),
    });
    await renderAndSave();
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Unauthorized", "Session expired")
    );
  });

  it("🎯 PUT 500 → generic 'Update Failed' toast title", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "DB write failed" }),
    });
    await renderAndSave();
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Update Failed", "DB write failed")
    );
  });

  it("🎯 PUT network reject → 'Network Error' toast with the JS error msg", async () => {
    fetchMock.mockRejectedValueOnce(new Error("connection refused"));
    await renderAndSave();
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Network Error",
        "Could not reach the server: connection refused"
      )
    );
  });
});
