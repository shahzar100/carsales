/**
 * Tests for src/components/Admin/ReservationsTable.tsx
 *
 * Standards coverage:
 * - 📋 Functional: row rendering with reference / customer / car /
 *   formatted price / formatted dates / status pill; per-row action
 *   buttons match the lifecycle (Confirm only when pending, Cancel when
 *   pending or confirmed, neither when cancelled/expired)
 * - 🎯 Usability: status filter pushes /admin/dashboard/reservations?status=…;
 *   empty state copy; "Clear" link only when a filter is active; error
 *   banner on PATCH failure
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/dashboard/reservations",
}));

import ReservationsTable from "@/components/Admin/ReservationsTable";
import type { Reservation } from "@/lib/interfaces";

const sample: Reservation[] = [
  {
    _id: "r-1",
    reservationReference: "RS-AAA001",
    customerInfo: {
      name: "Alice Andrews",
      email: "alice@example.com",
      phone: "07700 900001",
    },
    carDetails: {
      year: 2023,
      make: "Tesla",
      model: "Model 3",
      price: 35000,
    },
    status: "pending",
    createdAt: new Date("2026-05-01T10:00:00Z"),
    expiresAt: new Date("2026-05-03T10:00:00Z"),
  } as unknown as Reservation,
  {
    _id: "r-2",
    reservationReference: "RS-BBB002",
    customerInfo: {
      name: "Bob Brown",
      email: "bob@example.com",
      phone: "07700 900002",
    },
    carDetails: { year: 2022, make: "BMW", model: "320d", price: 24000 },
    status: "confirmed",
    createdAt: new Date("2026-05-02T10:00:00Z"),
    expiresAt: new Date("2026-05-04T10:00:00Z"),
  } as unknown as Reservation,
  {
    _id: "r-3",
    reservationReference: "RS-CCC003",
    customerInfo: {
      name: "Cara",
      email: "c@example.com",
      phone: "07700 900003",
    },
    carDetails: { year: 2021, make: "Audi", model: "A3", price: 18000 },
    status: "cancelled",
    createdAt: new Date("2026-05-03T10:00:00Z"),
    expiresAt: new Date("2026-05-05T10:00:00Z"),
  } as unknown as Reservation,
];

const pagination = { page: 1, limit: 50, total: 3 };
let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockPush.mockReset();
  mockRefresh.mockReset();
});

describe("ReservationsTable", () => {
  it("🎯 shows the empty state when rows is []", () => {
    render(
      <ReservationsTable
        rows={[]}
        filter={{}}
        pagination={{ page: 1, limit: 50, total: 0 }}
      />
    );
    expect(
      screen.getByText(/no reservations match the filters/i)
    ).toBeInTheDocument();
  });

  it("renders one row per reservation with reference / customer / car / price", () => {
    render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    expect(screen.getByText("RS-AAA001")).toBeInTheDocument();
    expect(screen.getByText("Alice Andrews")).toBeInTheDocument();
    expect(screen.getByText("2023 Tesla Model 3")).toBeInTheDocument();
    expect(screen.getByText("£35,000")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("Cara")).toBeInTheDocument();
  });

  it("📋 Confirm button only shows for pending; Cancel for pending/confirmed; neither for terminal states", () => {
    render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    const confirmButtons = screen.getAllByRole("button", { name: /^confirm$/i });
    const cancelButtons = screen.getAllByRole("button", { name: /^cancel$/i });
    // 1 pending → 1 confirm; pending + confirmed → 2 cancel; cancelled → 0 actions
    expect(confirmButtons).toHaveLength(1);
    expect(cancelButtons).toHaveLength(2);
  });

  it("📋 status filter change pushes /admin/dashboard/reservations?status=…", () => {
    render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.change(screen.getByLabelText(/status/i), {
      target: { value: "confirmed" },
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/admin/dashboard/reservations?status=confirmed"
    );
  });

  it("🎯 'Clear' link only shows when a filter is active", () => {
    const { rerender } = render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    expect(screen.queryByText(/clear/i)).not.toBeInTheDocument();

    rerender(
      <ReservationsTable
        rows={sample}
        filter={{ status: "pending" }}
        pagination={pagination}
      />
    );
    const clear = screen.getByText(/clear/i).closest("a");
    expect(clear).toHaveAttribute("href", "/admin/dashboard/reservations");
  });

  it("📋 Confirm → PATCHes /api/admin/reservations + router.refresh()", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/reservations");
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({
      id: "r-1",
      status: "confirmed",
    });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("🎯 surfaces server error on PATCH failure (no refresh)", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: "Car already sold",
      }),
    });
    render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() =>
      expect(screen.getByText(/car already sold/i)).toBeInTheDocument()
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("🎯 generic 'Network error' on fetch rejection", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    );
  });

  it("shows the total count in the filter strip", () => {
    render(
      <ReservationsTable rows={sample} filter={{}} pagination={pagination} />
    );
    expect(screen.getByText(/3 total/)).toBeInTheDocument();
  });
});
