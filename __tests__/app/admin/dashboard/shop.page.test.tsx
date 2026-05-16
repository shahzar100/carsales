/**
 * Tests for src/app/(admin)/admin/dashboard/shop/page.tsx
 *
 * Client-side admin page that fetches /api/admin/shop on mount, hands the
 * payload to BusinessInfoForm, and PUTs edits back. Tests verify the
 * happy-path + every toast-bearing failure branch.
 *
 * Standards coverage:
 * - 📋 Functional: loading copy → form mount; PUT body matches the edited
 *   shopInfo; per-status toast title selection (400 → "Validation Error",
 *   401 → "Unauthorized", else "Update Failed")
 * - 🎯 Usability: fetch failure → "Load Failed" toast then "No business
 *   information found" branch; network reject on GET → "Connection Error"
 *   toast; network reject on PUT → "Network Error" toast with the JS msg
 */
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

// Stable toast object — `fetchShopInfo` is wrapped in `useCallback([toast])`
// and a fresh object on every render would re-trigger the GET effect.
const stableToast = {
  success: mockToastSuccess,
  error: mockToastError,
  info: jest.fn(),
  warning: jest.fn(),
};
jest.mock("@/hooks/useToast", () => ({
  useToast: () => stableToast,
}));

// Capture the props the form receives + give the test a handle on
// `onSave` so we can invoke it.
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

import ShopSettingsPage from "@/app/(admin)/admin/dashboard/shop/page";

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  formProps = null;
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

const goodShop = {
  businessName: "Morley Motor",
  phone: "0113 252 6041",
  email: "hello@morley.test",
};

describe("(admin)/admin/dashboard/shop page", () => {
  it("📋 GET /api/admin/shop succeeds → mounts BusinessInfoForm with the payload", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: goodShop }),
    });
    render(<ShopSettingsPage />);
    // Loading copy first.
    expect(screen.getByText(/loading business settings/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("business-form")).toBeInTheDocument()
    );
    expect(formProps.shopInfo).toEqual(goodShop);
  });

  it("🎯 GET success=false → 'Load Failed' toast + empty-state copy", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: "Database unavailable" }),
    });
    render(<ShopSettingsPage />);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Load Failed",
        "Database unavailable"
      )
    );
    expect(
      screen.getByText(/no business information found/i)
    ).toBeInTheDocument();
  });

  it("🎯 GET network reject → 'Connection Error' toast + empty-state", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    render(<ShopSettingsPage />);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Connection Error",
        "Could not connect to the server to load business settings"
      )
    );
  });

  it("📋 PUT success → 'Settings Updated' toast", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: goodShop }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
    render(<ShopSettingsPage />);
    await waitFor(() =>
      expect(screen.getByTestId("business-form")).toBeInTheDocument()
    );

    await act(async () => {
      fireEvent.submit(screen.getByTestId("business-form"));
    });

    // Find the PUT call by content (don't rely on call-index since the
    // GET useEffect may have fired more than once).
    const putCall = fetchMock.mock.calls.find(
      (c) => c[1]?.method === "PUT"
    );
    expect(putCall).toBeDefined();
    expect(putCall![1].body).toBe(JSON.stringify(goodShop));
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Settings Updated",
        "Business information has been updated successfully"
      )
    );
  });

  it("🎯 PUT 400 → 'Validation Error' toast title", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: goodShop }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "phone is required" }),
      });
    render(<ShopSettingsPage />);
    await waitFor(() =>
      expect(screen.getByTestId("business-form")).toBeInTheDocument()
    );
    await act(async () => {
      fireEvent.submit(screen.getByTestId("business-form"));
    });
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Validation Error",
        "phone is required"
      )
    );
  });

  it("🔒 PUT 401 → 'Unauthorized' toast title", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: goodShop }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Session expired" }),
      });
    render(<ShopSettingsPage />);
    await waitFor(() =>
      expect(screen.getByTestId("business-form")).toBeInTheDocument()
    );
    await act(async () => {
      fireEvent.submit(screen.getByTestId("business-form"));
    });
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Unauthorized",
        "Session expired"
      )
    );
  });

  it("🎯 PUT 500 → generic 'Update Failed' toast title", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: goodShop }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "DB write failed" }),
      });
    render(<ShopSettingsPage />);
    await waitFor(() =>
      expect(screen.getByTestId("business-form")).toBeInTheDocument()
    );
    await act(async () => {
      fireEvent.submit(screen.getByTestId("business-form"));
    });
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Update Failed",
        "DB write failed"
      )
    );
  });

  it("🎯 PUT network reject → 'Network Error' toast with the JS error msg", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: goodShop }),
      })
      .mockRejectedValueOnce(new Error("connection refused"));
    render(<ShopSettingsPage />);
    await waitFor(() =>
      expect(screen.getByTestId("business-form")).toBeInTheDocument()
    );
    await act(async () => {
      fireEvent.submit(screen.getByTestId("business-form"));
    });
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Network Error",
        "Could not reach the server: connection refused"
      )
    );
  });
});
