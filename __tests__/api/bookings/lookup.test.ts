/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/bookings/lookup/route";
import {
  getTestCollections,
  createTestServiceAppointment,
  createTestCarViewingBooking,
} from "../../utils/testUtils";

describe("/api/bookings/lookup", () => {
  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("GET", () => {
    it("should find service appointment by booking reference", async () => {
      // Seed database with test service appointment
      const { serviceAppointments, client } = await getTestCollections();
      const testBooking = createTestServiceAppointment({
        bookingReference: "BK-SERV01",
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-SERV01&email=john@example.com"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.booking.bookingReference).toBe("BK-SERV01");
      expect(data.data.type).toBe("service");
      expect(data.data.booking.customerInfo.name).toBe(
        testBooking.customerInfo.name
      );
    });

    it("should find car viewing booking by booking reference", async () => {
      // Seed database with test car viewing booking
      const { carViewingBookings, client } = await getTestCollections();
      const testBooking = createTestCarViewingBooking({
        bookingReference: "BK-VIEW01",
      });
      await carViewingBookings.insertOne(testBooking);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-VIEW01&email=jane@example.com"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.booking.bookingReference).toBe("BK-VIEW01");
      expect(data.data.type).toBe("viewing");
      expect(data.data.booking.customerInfo.name).toBe(
        testBooking.customerInfo.name
      );
    });

    it("should return 400 when booking reference is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Booking reference is required");
    });

    it("should return 400 when email is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-TEST01"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Email address is required");
    });

    it("should return 404 when booking is not found", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-NOEXST&email=nobody@example.com"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Booking not found");
    });

    it("should handle empty booking reference parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref="
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Booking reference is required");
    });

    it("should return 404 when email does not match booking", async () => {
      const { serviceAppointments, client } = await getTestCollections();
      const testBooking = createTestServiceAppointment({
        bookingReference: "BK-EMAL01",
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-EMAL01&email=wrong@example.com"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Booking not found");
    });

    it("should prioritize service appointments over car viewings when both exist with same reference", async () => {
      // This shouldn't happen in practice due to unique constraints, but let's test the behavior
      const { serviceAppointments, carViewingBookings, client } =
        await getTestCollections();

      const serviceBooking = createTestServiceAppointment({
        bookingReference: "BK-DUPL01",
      });
      const viewingBooking = createTestCarViewingBooking({
        bookingReference: "BK-DUPL01",
      });

      await serviceAppointments.insertOne(serviceBooking);
      await carViewingBookings.insertOne(viewingBooking);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-DUPL01&email=john@example.com"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.type).toBe("service");
    });

    it("should return 500 when an internal error occurs", async () => {
      // Use jest.resetModules + doMock to override getter-only ESM exports
      jest.resetModules();
      jest.doMock("@/lib/models", () => {
        const actual = jest.requireActual("@/lib/models");
        return {
          ...actual,
          getServiceAppointmentsCollection: jest
            .fn()
            .mockRejectedValue(new Error("DB error")),
        };
      });
      jest.doMock("@/lib/utils/rateLimit", () => ({
        createRateLimiter: () => ({
          // check() is async on the real implementation.
          check: async () => ({ allowed: true, remaining: 10, resetIn: 0 }),
          reset: async () => {},
        }),
      }));
      const { GET: mockedGET } = require("@/app/api/bookings/lookup/route");

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-TEST01&email=test@example.com"
      );
      const response = await mockedGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
