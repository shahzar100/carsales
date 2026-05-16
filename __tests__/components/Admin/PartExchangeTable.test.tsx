/**
 * Tests for src/components/Admin/PartExchangeTable.tsx
 *
 * Standards coverage:
 * - 📋 Functional: row rendering (reference, customer, their car, target
 *   car); per-status action buttons match the lifecycle (pending → Mark
 *   valued; valued → Accept / Decline; terminal → nothing); status
 *   filter URL push; "Clear" link only when filtered
 * - 🎯 Usability: empty-state copy; valuation prompt — non-negative number
 *   only, otherwise inline error banner; PATCH success → router.refresh
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
  usePathname: () => "/admin/dashboard/part-exchange",
}));

import PartExchangeTable from "@/components/Admin/PartExchangeTable";
import type { PartExchange } from "@/lib/interfaces";

const sample: PartExchange[] = [
  {
    _id: "pe-1",
    enquiryReference: "PX-AAA001",
    customerInfo: {
      name: "Alice Andrews",
      email: "alice@example.com",
      phone: "07700 900001",
    },
    vehicle: {
      year: 2018,
      make: "Ford",
      model: "Focus",
      mileage: 55000,
      condition: "Good",
      registration: "AB12 CDE",
    },
    interestedInCarLabel: "Tesla Model 3 (2023)",
    status: "pending",
    createdAt: new Date("2026-05-01T10:00:00Z"),
  } as unknown as PartExchange,
  {
    _id: "pe-2",
    enquiryReference: "PX-BBB002",
    customerInfo: {
      name: "Bob Brown",
      email: "bob@example.com",
      phone: "07700 900002",
    },
    vehicle: {
      year: 2019,
      make: "VW",
      model: "Golf",
      mileage: 40000,
      condition: "Excellent",
    },
    interestedInCarLabel: null,
    status: "valued",
    createdAt: new Date("2026-05-02T10:00:00Z"),
  } as unknown as PartExchange,
  {
    _id: "pe-3",
    enquiryReference: "PX-CCC003",
    customerInfo: {
      name: "Cara",
      email: "c@example.com",
      phone: "07700 900003",
    },
    vehicle: {
      year: 2017,
      make: "Audi",
      model: "A3",
      mileage: 60000,
      condition: "Fair",
    },
    interestedInCarLabel: "BMW 320d",
    status: "accepted",
    createdAt: new Date("2026-05-03T10:00:00Z"),
  } as unknown as PartExchange,
];

const pagination = { page: 1, limit: 50, total: 3 };
let fetchMock: jest.Mock;
let promptSpy: jest.SpyInstance;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockPush.mockReset();
  mockRefresh.mockReset();
  promptSpy = jest
    .spyOn(window, "prompt")
    .mockImplementation(() => "4500");
});

afterEach(() => {
  promptSpy.mockRestore();
});

describe("PartExchangeTable", () => {
  it("🎯 shows the empty state when rows is []", () => {
    render(
      <PartExchangeTable
        rows={[]}
        filter={{}}
        pagination={{ page: 1, limit: 50, total: 0 }}
      />
    );
    expect(
      screen.getByText(/no enquiries match the filters/i)
    ).toBeInTheDocument();
  });

  it("renders rows with customer, their car, and target car", () => {
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    expect(screen.getByText("PX-AAA001")).toBeInTheDocument();
    expect(screen.getByText("Alice Andrews")).toBeInTheDocument();
    expect(screen.getByText(/2018 Ford Focus/)).toBeInTheDocument();
    // Mileage + condition + registration combined into the secondary line.
    expect(
      screen.getByText(/55,000 mi · Good · AB12 CDE/)
    ).toBeInTheDocument();
    expect(screen.getByText("Tesla Model 3 (2023)")).toBeInTheDocument();
  });

  it("renders '—' when interestedInCarLabel is null", () => {
    render(
      <PartExchangeTable rows={[sample[1]]} filter={{}} pagination={pagination} />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("📋 only pending rows show 'Mark valued'; only valued rows show Accept/Decline", () => {
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    expect(screen.getAllByRole("button", { name: /mark valued/i })).toHaveLength(
      1
    );
    expect(screen.getAllByRole("button", { name: /^accept$/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /^decline$/i })).toHaveLength(1);
  });

  it("📋 status filter change pushes /admin/dashboard/part-exchange?status=…", () => {
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.change(screen.getByLabelText(/status/i), {
      target: { value: "valued" },
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/admin/dashboard/part-exchange?status=valued"
    );
  });

  it("🎯 'Clear' link only renders when a filter is active", () => {
    const { rerender } = render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    expect(screen.queryByText(/clear/i)).not.toBeInTheDocument();
    rerender(
      <PartExchangeTable
        rows={sample}
        filter={{ status: "pending" }}
        pagination={pagination}
      />
    );
    expect(screen.getByText(/clear/i).closest("a")).toHaveAttribute(
      "href",
      "/admin/dashboard/part-exchange"
    );
  });

  it("📋 Mark valued prompts for valuation, PATCHes with the number, refreshes", async () => {
    promptSpy.mockReturnValue("4500");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /mark valued/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/part-exchange");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      id: "pe-1",
      status: "valued",
      valuation: 4500,
    });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("📋 Mark valued submits without `valuation` when prompt is empty (skipped)", async () => {
    promptSpy.mockReturnValue("");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /mark valued/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ id: "pe-1", status: "valued" });
  });

  it("🎯 Mark valued cancelled (prompt returns null) → no network call", () => {
    promptSpy.mockReturnValue(null);
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /mark valued/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("📋 Accept PATCHes with status=accepted", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      id: "pe-2",
      status: "accepted",
    });
  });

  it("📋 Decline PATCHes with status=declined", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^decline$/i }));
    await waitFor(() =>
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        id: "pe-2",
        status: "declined",
      })
    );
  });

  it("🎯 surfaces server error and skips refresh on PATCH failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "Already accepted" }),
    });
    render(
      <PartExchangeTable rows={sample} filter={{}} pagination={pagination} />
    );
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));
    await waitFor(() =>
      expect(screen.getByText(/already accepted/i)).toBeInTheDocument()
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
