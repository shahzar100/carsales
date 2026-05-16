/**
 * Tests for src/components/Admin/QuotesTable.tsx
 *
 * Standards coverage:
 * - 📋 Functional: per-status action buttons match the lifecycle —
 *   pending → "Mark responded", responded → "Mark accepted"; "Expire"
 *   is available on any non-terminal row; terminal (accepted/expired)
 *   show no actions
 * - 🎯 Usability: status filter URL push; "Clear" link only when filter
 *   active; empty-state; response prompt is optional (skipped → no
 *   `responseMessage` in body)
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
  usePathname: () => "/admin/dashboard/quotes",
}));

import QuotesTable from "@/components/Admin/QuotesTable";
import type { Quote } from "@/lib/interfaces";

const sample: Quote[] = [
  {
    _id: "q-1",
    quoteReference: "QT-AAA001",
    customerInfo: {
      name: "Alice",
      email: "a@example.com",
      phone: "07700 900001",
    },
    serviceType: "Detailing",
    serviceDetails: "Full interior + exterior",
    vehicle: {
      year: 2023,
      make: "Tesla",
      model: "Model 3",
      registration: "AB12 CDE",
    },
    status: "pending",
    createdAt: new Date("2026-05-01T10:00:00Z"),
  } as unknown as Quote,
  {
    _id: "q-2",
    quoteReference: "QT-BBB002",
    customerInfo: {
      name: "Bob",
      email: "b@example.com",
      phone: "07700 900002",
    },
    serviceType: "Tints",
    serviceDetails: "",
    vehicle: { year: 2020, make: "BMW", model: "320d", registration: null },
    status: "responded",
    createdAt: new Date("2026-05-02T10:00:00Z"),
  } as unknown as Quote,
  {
    _id: "q-3",
    quoteReference: "QT-CCC003",
    customerInfo: {
      name: "Cara",
      email: "c@example.com",
      phone: "07700 900003",
    },
    serviceType: "Repairs",
    serviceDetails: "Brakes",
    vehicle: { year: 2018, make: "Audi", model: "A3", registration: "CD34 EFG" },
    status: "accepted",
    createdAt: new Date("2026-05-03T10:00:00Z"),
  } as unknown as Quote,
];

const pagination = { page: 1, limit: 50, total: 3 };
let fetchMock: jest.Mock;
let promptSpy: jest.SpyInstance;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockPush.mockReset();
  mockRefresh.mockReset();
  promptSpy = jest.spyOn(window, "prompt").mockImplementation(() => "quoted £150");
});

afterEach(() => {
  promptSpy.mockRestore();
});

describe("QuotesTable", () => {
  it("🎯 shows the empty state when rows is []", () => {
    render(
      <QuotesTable
        rows={[]}
        filter={{}}
        pagination={{ page: 1, limit: 50, total: 0 }}
      />
    );
    expect(
      screen.getByText(/no quotes match the filters/i)
    ).toBeInTheDocument();
  });

  it("renders rows with reference + customer + service + vehicle", () => {
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    expect(screen.getByText("QT-AAA001")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Detailing")).toBeInTheDocument();
    expect(screen.getByText("Full interior + exterior")).toBeInTheDocument();
    expect(screen.getByText(/2023 Tesla Model 3/)).toBeInTheDocument();
    expect(screen.getByText("AB12 CDE")).toBeInTheDocument();
  });

  it("📋 lifecycle: pending → Mark responded; responded → Mark accepted; terminal → no buttons", () => {
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    expect(
      screen.getAllByRole("button", { name: /mark responded/i })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: /mark accepted/i })
    ).toHaveLength(1);
    // "Expire" appears on pending + responded (non-terminal rows).
    expect(screen.getAllByRole("button", { name: /^expire$/i })).toHaveLength(2);
  });

  it("📋 status filter pushes /admin/dashboard/quotes?status=…", () => {
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    fireEvent.change(screen.getByLabelText(/status/i), {
      target: { value: "responded" },
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/admin/dashboard/quotes?status=responded"
    );
  });

  it("🎯 'Clear' link only renders when a filter is active", () => {
    const { rerender } = render(
      <QuotesTable rows={sample} filter={{}} pagination={pagination} />
    );
    expect(screen.queryByText(/clear/i)).not.toBeInTheDocument();
    rerender(
      <QuotesTable
        rows={sample}
        filter={{ status: "pending" }}
        pagination={pagination}
      />
    );
    expect(screen.getByText(/clear/i).closest("a")).toHaveAttribute(
      "href",
      "/admin/dashboard/quotes"
    );
  });

  it("📋 Mark responded prompts then PATCHes with responseMessage when supplied", async () => {
    promptSpy.mockReturnValue("Quoted £150 over the phone");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    fireEvent.click(screen.getByRole("button", { name: /mark responded/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/quotes");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      id: "q-1",
      status: "responded",
      responseMessage: "Quoted £150 over the phone",
    });
  });

  it("📋 Mark responded omits responseMessage when prompt returns empty string", async () => {
    promptSpy.mockReturnValue("");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    fireEvent.click(screen.getByRole("button", { name: /mark responded/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.responseMessage).toBeUndefined();
  });

  it("🎯 Mark responded cancelled (prompt=null) → no PATCH", () => {
    promptSpy.mockReturnValue(null);
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    fireEvent.click(screen.getByRole("button", { name: /mark responded/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("📋 Mark accepted PATCHes with status=accepted (no prompt)", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    fireEvent.click(screen.getByRole("button", { name: /mark accepted/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      id: "q-2",
      status: "accepted",
    });
  });

  it("📋 Expire button PATCHes with status=expired", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    // Click the FIRST Expire button — both pending and responded show one.
    fireEvent.click(
      screen.getAllByRole("button", { name: /^expire$/i })[0]
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).status).toBe("expired");
  });

  it("🎯 server error from PATCH surfaces in the banner and skips refresh", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "Quote already accepted" }),
    });
    render(<QuotesTable rows={sample} filter={{}} pagination={pagination} />);
    fireEvent.click(screen.getByRole("button", { name: /mark accepted/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/quote already accepted/i)
      ).toBeInTheDocument()
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
