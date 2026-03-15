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
}));
const { isAuthenticated: mockIsAuthenticated } = require("@/lib/utils/auth");

describe("/api/admin/bookings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
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

      for (const status of validStatuses) {
        const inserted = await serviceAppointments.insertOne(
          createTestServiceAppointment({
            bookingReference: `BK-${status.toUpperCase().slice(0, 6).padEnd(6, "0")}`,
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
