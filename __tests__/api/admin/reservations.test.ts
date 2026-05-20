/**
 * @jest-environment node
 *
 * Tests for /api/admin/reservations (Day 10 / Fix 10.3).
 *
 * Scope: GET filtered list, PATCH status transition, auth enforcement,
 * and bad-input rejection. The customer-facing reservation creation
 * happens elsewhere (/api/bookings/reservation) and isn't retouched.
 */
import { NextRequest } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { GET, PATCH } from "@/app/api/admin/reservations/route";

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hasMinimumRole: jest.fn(),
  getSession: jest.fn().mockResolvedValue({ username: "admin-test" }),
}));
jest.mock("@/lib/utils/audit", () => ({
  recordAudit: jest.fn().mockResolvedValue(undefined),
}));

const {
  isAuthenticated: mockIsAuthenticated,
  hasMinimumRole: mockHasMinimumRole,
} = require("@/lib/utils/auth");
const { recordAudit: mockRecordAudit } = require("@/lib/utils/audit");

// Each fixture gets a unique carId because the reservations collection
// has a partial-unique index on { carId } for { status: pending|confirmed }.
let carIdSeed = 0;
const nextCarId = () => `car-${++carIdSeed}-${Date.now().toString(36)}`;

const makeReservation = (overrides: Record<string, unknown> = {}) => ({
  reservationReference: `RES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  carId: nextCarId(),
  carDetails: {
    make: "BMW",
    model: "320d",
    year: 2020,
    price: 18500,
  },
  customerInfo: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "07700 900000",
  },
  status: "pending",
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("/api/admin/reservations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
  });

  // ── GET ─────────────────────────────────────────────────────
  describe("GET", () => {
    it("returns the reservation list for authed admin", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      await client.db("MMC").collection("reservations").insertMany([
        makeReservation(),
        makeReservation({ status: "confirmed" }),
      ]);
      await client.close();

      const res = await GET(
        new NextRequest("http://localhost:3000/api/admin/reservations")
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.reservations).toHaveLength(2);
    });

    it("filters by status when ?status=pending", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      await client.db("MMC").collection("reservations").insertMany([
        makeReservation(),
        makeReservation({ status: "confirmed" }),
        makeReservation({ status: "cancelled" }),
      ]);
      await client.close();

      const res = await GET(
        new NextRequest(
          "http://localhost:3000/api/admin/reservations?status=pending"
        )
      );
      const body = await res.json();
      expect(body.data.reservations).toHaveLength(1);
      expect(body.data.reservations[0].status).toBe("pending");
    });

    it("returns 401 when unauthenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);
      const res = await GET(
        new NextRequest("http://localhost:3000/api/admin/reservations")
      );
      expect(res.status).toBe(401);
    });
  });

  // ── PATCH ───────────────────────────────────────────────────
  describe("PATCH", () => {
    it("transitions a reservation to confirmed and records audit", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      const { insertedId } = await client
        .db("MMC")
        .collection("reservations")
        .insertOne(makeReservation());
      await client.close();

      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/reservations", {
          method: "PATCH",
          body: JSON.stringify({
            id: insertedId.toHexString(),
            status: "confirmed",
          }),
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.reservation.status).toBe("confirmed");
      expect(body.data.reservation.confirmedAt).toBeTruthy();
      expect(mockRecordAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: "admin-test",
          action: "reservation.confirmed",
          targetType: "reservation",
          targetId: insertedId.toHexString(),
        })
      );
    });

    it("captures a cancellation reason on cancel", async () => {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      const { insertedId } = await client
        .db("MMC")
        .collection("reservations")
        .insertOne(makeReservation());
      await client.close();

      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/reservations", {
          method: "PATCH",
          body: JSON.stringify({
            id: insertedId.toHexString(),
            status: "cancelled",
            reason: "Customer changed their mind",
          }),
        })
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.reservation.cancellationReason).toBe(
        "Customer changed their mind"
      );
      expect(body.data.reservation.cancelledAt).toBeTruthy();
    });

    it("returns 401 when unauthenticated", async () => {
      mockIsAuthenticated.mockResolvedValue(false);
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/reservations", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "confirmed",
          }),
        })
      );
      expect(res.status).toBe(401);
    });

    it("rejects an invalid status", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/reservations", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "bogus",
          }),
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown id", async () => {
      const res = await PATCH(
        new NextRequest("http://localhost:3000/api/admin/reservations", {
          method: "PATCH",
          body: JSON.stringify({
            id: new ObjectId().toHexString(),
            status: "confirmed",
          }),
        })
      );
      expect(res.status).toBe(404);
    });
  });
});
