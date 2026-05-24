/**
 * @jest-environment node
 *
 * Tests for /api/admin/bookings/export route
 * (src/app/api/admin/bookings/export/route.ts).
 *
 * Covers:
 *  - auth: 401 when not signed in, 403 when role < manager
 *  - CSV header row matches the declared column list
 *  - row count == total booking count across both collections
 *  - RFC-4180 quoting on values containing `"`, `,` and `\n`
 */

// Auth mocks — match the patterns used in __tests__/api/admin/bookings.test.ts.
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hasMinimumRole: jest.fn(),
  getSession: jest.fn(async () => ({ username: "test-admin" })),
}));

// Stub the collection getters — the route only ever calls .find().sort().toArray().
type Doc = Record<string, unknown>;
let serviceDocs: Doc[] = [];
let viewingDocs: Doc[] = [];

function mkCursor(docs: Doc[]) {
  return {
    sort() {
      return this;
    },
    async toArray() {
      return docs;
    },
  };
}

jest.mock("@/lib/models", () => ({
  getServiceAppointmentsCollection: jest.fn(async () => ({
    find: () => mkCursor(serviceDocs),
  })),
  getCarViewingBookingsCollection: jest.fn(async () => ({
    find: () => mkCursor(viewingDocs),
  })),
}));

// Allow-all rate-limit stub for the suite; one test below installs a
// block-all stub to assert 429 behaviour.
const mockRateLimitCheck = jest
  .fn()
  .mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 });
jest.mock("@/lib/utils/rateLimit", () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
    reset: jest.fn().mockResolvedValue(undefined),
  }),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/bookings/export/route";
import { isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";

function makeRequest() {
  return new NextRequest(
    "http://localhost:3000/api/admin/bookings/export",
    { method: "GET" }
  );
}

const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>;
const mockHasMinimumRole = hasMinimumRole as jest.MockedFunction<
  typeof hasMinimumRole
>;

const HEADER =
  '"ref","customerName","customerEmail","customerPhone","serviceType","status","scheduledDate","scheduledTime","vehicleMake","vehicleModel","notes","createdAt","updatedAt"';

beforeEach(() => {
  jest.clearAllMocks();
  serviceDocs = [];
  viewingDocs = [];
  mockIsAuthenticated.mockResolvedValue(true);
  mockHasMinimumRole.mockResolvedValue(true);
  mockRateLimitCheck
    .mockReset()
    .mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 });
});

describe("GET /api/admin/bookings/export", () => {
  it("returns 429 when the per-IP export cap is hit", async () => {
    mockRateLimitCheck.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 60_000,
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("returns 401 when not authenticated", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated but role < manager", async () => {
    mockHasMinimumRole.mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns text/csv with attachment filename containing today's date", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    const today = new Date().toISOString().slice(0, 10);
    expect(res.headers.get("content-disposition")).toBe(
      `attachment; filename="bookings-${today}.csv"`
    );
  });

  it("emits only the header row when there are no bookings", async () => {
    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trimEnd().split("\r\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(HEADER);
  });

  it("emits header + one row per booking across both collections", async () => {
    serviceDocs = [
      {
        bookingReference: "SV-1",
        customerInfo: { name: "Alice", email: "a@x.com", phone: "1" },
        serviceType: "Oil Change",
        status: "pending",
        appointmentDate: "2026-01-01",
        appointmentTime: "10:00",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];
    viewingDocs = [
      {
        bookingReference: "VW-1",
        customerInfo: { name: "Bob", email: "b@x.com", phone: "2" },
        carDetails: { make: "Ford", model: "Focus" },
        status: "confirmed",
        appointmentDate: "2026-01-02",
        appointmentTime: "12:00",
        createdAt: new Date("2026-01-02T00:00:00Z"),
        updatedAt: new Date("2026-01-02T00:00:00Z"),
      },
      {
        bookingReference: "VW-2",
        customerInfo: { name: "Carol", email: "c@x.com", phone: "3" },
        carDetails: { make: "BMW", model: "320d" },
        status: "completed",
        appointmentDate: "2026-01-03",
        appointmentTime: "14:00",
        createdAt: new Date("2026-01-03T00:00:00Z"),
        updatedAt: new Date("2026-01-03T00:00:00Z"),
      },
    ];

    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trimEnd().split("\r\n");

    expect(lines[0]).toBe(HEADER);
    expect(lines).toHaveLength(1 + 1 + 2); // header + 1 service + 2 viewings
    expect(lines[1]).toContain('"SV-1"');
    expect(lines[1]).toContain('"Oil Change"');
    expect(lines[2]).toContain('"VW-1"');
    expect(lines[2]).toContain('"Ford"');
    expect(lines[2]).toContain('"Focus"');
  });

  it("RFC-4180 escapes embedded quotes, commas, and newlines", async () => {
    serviceDocs = [
      {
        bookingReference: 'BK"WEIRD,01',
        customerInfo: {
          name: 'O"Reilly, Patrick',
          email: "p@x.com",
          phone: "1",
        },
        serviceType: "Note",
        serviceDetails: "first line\nsecond line",
        status: "pending",
        appointmentDate: "2026-01-01",
        appointmentTime: "10:00",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];

    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trimEnd().split("\r\n");

    // The data row is a single logical row — no embedded raw newline split
    // means we still have exactly 2 lines (header + 1 data row).
    expect(lines).toHaveLength(2);
    // `"` is escaped as `""` inside the quoted cell.
    expect(lines[1]).toContain('"O""Reilly, Patrick"');
    // Comma in the ref must stay inside the surrounding quotes, not
    // create a new column.
    expect(lines[1]).toContain('"BK""WEIRD,01"');
    // Embedded newline must be replaced with a space (no raw `\n`).
    expect(lines[1]).toContain('"first line second line"');
    expect(lines[1]).not.toMatch(/first line\nsecond/);
  });
});
