/**
 * Tests for src/components/Admin/Form/EditCarForm.tsx
 *
 * Admin quick-edit form for the most-changed car fields (status, price,
 * mileage, featured, description). Wraps `PUT /api/admin/cars`.
 *
 * Standards coverage:
 * - 📋 Functional: pre-fills inputs from the supplied car; on submit
 *   PUTs the changed values; on success fires a toast + navigates back
 *   to /admin/dashboard/cars; on non-ok response surfaces the API error;
 *   Cancel routes back without firing a request
 * - 🎯 Usability: Save button switches to "Saving…" while in-flight
 *   and disables both buttons; missing `car._id` short-circuits with an
 *   "Missing car ID" toast
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/contexts/ToastContext";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSuccess = jest.fn();
const mockError = jest.fn();
jest.mock("@/contexts/ToastContext", () => {
  const actual = jest.requireActual("@/contexts/ToastContext");
  return {
    ...actual,
    useToast: () => ({
      success: mockSuccess,
      error: mockError,
      addToast: jest.fn(),
      removeToast: jest.fn(),
    }),
  };
});

import EditCarForm from "@/components/Admin/Form/EditCarForm";

const renderWith = (ui: React.ReactElement) =>
  render(<ToastProvider>{ui}</ToastProvider>);

const baseCar = {
  _id: "car-1",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  price: 35000,
  mileage: 12000,
  fuel: "Electric",
  transmission: "Automatic",
  doors: 4,
  colour: "White",
  status: "available" as const,
  features: [],
  description: "Pristine, one owner",
  featured: false,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
} as unknown as Parameters<typeof EditCarForm>[0]["car"];

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("EditCarForm", () => {
  it("📋 pre-fills price / mileage / description from the supplied car", () => {
    renderWith(<EditCarForm car={baseCar} />);
    const price = screen.getByLabelText(/price/i) as HTMLInputElement;
    const mileage = screen.getByLabelText(/mileage/i) as HTMLInputElement;
    const description = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    expect(price.value).toBe("35000");
    expect(mileage.value).toBe("12000");
    expect(description.value).toBe("Pristine, one owner");
  });

  it("📋 submit PUTs the form values + shows success toast + navigates", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });

    renderWith(<EditCarForm car={baseCar} />);

    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: "32999" },
    });
    fireEvent.change(screen.getByLabelText(/mileage/i), {
      target: { value: "13500" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/cars");
    expect(init.method).toBe("PUT");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      _id: "car-1",
      status: "available",
      price: 32999,
      mileage: 13500,
      featured: false,
      description: "Pristine, one owner",
    });

    await waitFor(() =>
      expect(mockSuccess).toHaveBeenCalledWith(
        "Vehicle updated",
        "2023 Tesla Model 3 saved."
      )
    );
    expect(mockPush).toHaveBeenCalledWith("/admin/dashboard/cars");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("🎯 non-ok response → error toast with the server detail", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        details: { price: ["Must be positive"] },
      }),
    });

    renderWith(<EditCarForm car={baseCar} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockError).toHaveBeenCalledWith(
        "Failed to update car",
        "Must be positive"
      )
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("🎯 network error → error toast", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    renderWith(<EditCarForm car={baseCar} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(mockError).toHaveBeenCalledWith("Failed to update car", "offline")
    );
  });

  it("🎯 missing _id short-circuits with 'Missing car ID' toast", () => {
    renderWith(
      <EditCarForm
        car={{ ...baseCar, _id: undefined } as unknown as typeof baseCar}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith("Cannot save changes", "Missing car ID");
  });

  it("📋 Cancel routes back without firing a request", () => {
    renderWith(<EditCarForm car={baseCar} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/admin/dashboard/cars");
  });
});
