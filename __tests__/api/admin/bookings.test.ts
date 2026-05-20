/**
 * @jest-environment node
 *
 * Tests for /api/admin/bookings route (src/app/api/admin/bookings/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: GET all bookings, PUT update status
 * - 🔒 Security: Authentication enforcement, input validation
 * - 🎯 Usability: Error messages for invalid input
 */
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/admin/bookings/route";
import {
  getTestCollections,
  createTestServiceAppointment,
  createTestCarViewingBooking,
} from "../../utils/testUtils";

// Mock authentication
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hasMinimumRole: jest.fn(),
  // Audit-log writes pull the actor from getSession; without this mock the
  // PUT path throws `(0 , _auth.getSession) is not a function` → 500.
  getSession: jest.fn(async () => ({ username: "test-admin" })),
}));
const {
  isAuthenticated: mockIsAuthenticated,
  hasMinimumRole: mockHasMinimumRole,
} = require("@/lib/utils/auth");

describe("/api/admin/bookings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  // ── GET ─────────────────────────────────────────────────────

  describe("GET", () => {
    it("should return all bookings for authenticated admin", async () => {
      const { serviceAppointments, carViewingBookings, client } =
        await getTestCollections();
      await serviceAppointments.insertOne(createTestServiceAppointment());
      await carViewingBookings.insertOne(createTestCarViewingBooking());
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.serviceBookings).toHaveLength(1);
      expect(data.data.viewingBookings).toHaveLength(1);
    });

    it("should return empty arrays when no bookings exist", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.serviceBookings).toHaveLength(0);
      expect(data.data.viewingBookings).toHaveLength(0);
    });

    it("should return 401 for unauthenticated requests", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  // ── PUT ─────────────────────────────────────────────────────

  describe("PUT", () => {
    it("should update a service booking status", async () => {
      const { serviceAppointments, client } = await getTestCollections();
      const inserted = await serviceAppointments.insertOne(
        createTestServiceAppointment()
      );
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({
            bookingId: inserted.insertedId.toHexString(),
            status: "confirmed",
            type: "service",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("confirmed");
    });

    it("should update a viewing booking status", async () => {
      const { carViewingBookings, client } = await getTestCollections();
      const inserted = await carViewingBookings.insertOne(
        createTestCarViewingBooking()
      );
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({
            bookingId: inserted.insertedId.toHexString(),
            status: "completed",
            type: "viewing",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 401 for unauthenticated requests", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({
            bookingId: "507f1f77bcf86cd799439011",
            status: "confirmed",
            type: "service",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when required fields are missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({ bookingId: "abc" }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required fields");
    });

    it("should return 400 for invalid status", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({
            bookingId: "507f1f77bcf86cd799439011",
            status: "invalid-status",
            type: "service",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid status");
    });

    it("should return 400 for invalid type", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({
            bookingId: "507f1f77bcf86cd799439011",
            status: "confirmed",
            type: "invalid-type",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid type");
    });

    it("should return 400 for invalid booking ID format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({
            bookingId: "not-a-valid-objectid",
            status: "confirmed",
            type: "service",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid booking ID");
    });

    it("should return 404 when booking not found", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/bookings",
        {
          method: "PUT",
          body: JSON.stringify({
            bookingId: "507f1f77bcf86cd799439011",
            status: "confirmed",
            type: "service",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
      const { serviceAppointments, client } = await getTestCollections();

      // Each insert needs a unique appointment slot — the
      // `uniq_active_service_slot` index disallows two active bookings on
      // the same date/time pair. Iterate dates so the loop seeds cleanly.
      const baseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      validStatuses.forEach((_, i) => void i);
      let offset = 0;
      for (const status of validStatuses) {
        offset += 1;
        const apptDate = new Date(baseDate.getTime() + offset * 86400000)
          .toISOString()
          .slice(0, 10);
        const inserted = await serviceAppointments.insertOne(
          createTestServiceAppointment({
            bookingReference: `BK-${status.toUpperCase().slice(0, 6).padEnd(6, "0")}`,
            appointmentDate: apptDate,
            appointmentTime: "10:00 AM",
          })
        );

        const request = new NextRequest(
          "http://localhost:3000/api/admin/bookings",
          {
            method: "PUT",
            body: JSON.stringify({
              bookingId: inserted.insertedId.toHexString(),
              status,
              type: "service",
            }),
          }
        );

        const response = await PUT(request);
        expect(response.status).toBe(200);
      }
      await client.close();
    });
  });
});
