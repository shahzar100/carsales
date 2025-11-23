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
        bookingReference: "BK-SERVICE1",
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-SERVICE1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.booking.bookingReference).toBe("BK-SERVICE1");
      expect(data.data.type).toBe("service");
      expect(data.data.booking.customerInfo.name).toBe(
        testBooking.customerInfo.name
      );
    });

    it("should find car viewing booking by booking reference", async () => {
      // Seed database with test car viewing booking
      const { carViewingBookings, client } = await getTestCollections();
      const testBooking = createTestCarViewingBooking({
        bookingReference: "BK-VIEWING1",
      });
      await carViewingBookings.insertOne(testBooking);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-VIEWING1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.booking.bookingReference).toBe("BK-VIEWING1");
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

    it("should return 404 when booking is not found", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-NOTFOUND"
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

    it("should prioritize service appointments over car viewings when both exist with same reference", async () => {
      // This shouldn't happen in practice due to unique constraints, but let's test the behavior
      const { serviceAppointments, carViewingBookings, client } =
        await getTestCollections();

      const serviceBooking = createTestServiceAppointment({
        bookingReference: "BK-DUPLICATE",
      });
      const viewingBooking = createTestCarViewingBooking({
        bookingReference: "BK-DUPLICATE",
      });

      await serviceAppointments.insertOne(serviceBooking);
      await carViewingBookings.insertOne(viewingBooking);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/lookup?ref=BK-DUPLICATE"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.type).toBe("service");
    });
  });
});
