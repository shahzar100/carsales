/**
 * @jest-environment node
 *
 * Tests for /api/admin/cars/export route
 * (src/app/api/admin/cars/export/route.ts).
 *
 * Mirrors __tests__/app/api/admin/bookings/export/route.test.ts.
 */

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hasMinimumRole: jest.fn(),
  getSession: jest.fn(async () => ({ username: "test-admin" })),
}));

type Doc = Record<string, unknown>;
let carDocs: Doc[] = [];

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
  getCarsCollection: jest.fn(async () => ({
    find: () => mkCursor(carDocs),
  })),
}));

// Allow-all rate-limit stub for the suite; the 429 test installs its own.
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
import { GET } from "@/app/api/admin/cars/export/route";
import { isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";

function makeRequest() {
  return new NextRequest("http://localhost:3000/api/admin/cars/export", {
    method: "GET",
  });
}

const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>;
const mockHasMinimumRole = hasMinimumRole as jest.MockedFunction<
  typeof hasMinimumRole
>;

const HEADER =
  '"id","year","make","model","price","mileage","fuel","transmission","doors","colour","status","featured","createdAt","updatedAt"';

beforeEach(() => {
  jest.clearAllMocks();
  carDocs = [];
  mockIsAuthenticated.mockResolvedValue(true);
  mockHasMinimumRole.mockResolvedValue(true);
  mockRateLimitCheck
    .mockReset()
    .mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 });
});

describe("GET /api/admin/cars/export", () => {
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
      `attachment; filename="cars-${today}.csv"`
    );
  });

  it("emits only the header when there are no cars", async () => {
    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trimEnd().split("\r\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(HEADER);
  });

  it("emits header + one row per car, including ObjectId-shaped _id", async () => {
    carDocs = [
      {
        _id: { toHexString: () => "507f1f77bcf86cd799439011" },
        year: 2024,
        make: "Toyota",
        model: "Camry",
        price: 25000,
        mileage: 12000,
        fuel: "Petrol",
        transmission: "Automatic",
        doors: 4,
        colour: "White",
        status: "available",
        featured: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        _id: "raw-string-id-2",
        year: 2022,
        make: "Honda",
        model: "Civic",
        price: 18000,
        mileage: 30000,
        fuel: "Hybrid",
        transmission: "CVT",
        doors: 4,
        colour: "Black",
        status: "sold",
        featured: false,
        createdAt: new Date("2026-01-02T00:00:00Z"),
        updatedAt: new Date("2026-01-02T00:00:00Z"),
      },
    ];

    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trimEnd().split("\r\n");

    expect(lines[0]).toBe(HEADER);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"507f1f77bcf86cd799439011"');
    expect(lines[1]).toContain('"Toyota"');
    expect(lines[1]).toContain('"true"');
    expect(lines[2]).toContain('"raw-string-id-2"');
    expect(lines[2]).toContain('"false"');
  });

  it("RFC-4180 escapes embedded quotes, commas, and newlines in string cells", async () => {
    carDocs = [
      {
        _id: "id-1",
        year: 2024,
        make: 'Ro"ver, Land',
        model: "Defender\nspecial",
        price: 50000,
        mileage: 5000,
        fuel: "Diesel",
        transmission: "Manual",
        doors: 5,
        colour: "Green",
        status: "available",
        featured: false,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];

    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trimEnd().split("\r\n");

    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Ro""ver, Land"');
    expect(lines[1]).toContain('"Defender special"');
    expect(lines[1]).not.toMatch(/Defender\nspecial/);
  });
});
