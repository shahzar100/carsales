/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/cancel/route";
import {
  getTestCollections,
  createTestServiceAppointment,
  createTestCarViewingBooking,
} from "../../utils/testUtils";

// Mock authentication
const mockIsAuthenticated = jest.fn();
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: mockIsAuthenticated,
}));

// Mock email sending
const mockSendEmail = jest.fn();
jest.mock("@/emails/send", () => ({
  sendEmail: mockSendEmail,
}));

describe("/api/bookings/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true);
    mockSendEmail.mockResolvedValue({ success: true });
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("POST", () => {
    it("should cancel service booking successfully", async () => {
      // Create test service booking
      const { serviceAppointments, client } = await getTestCollections();
      const testBooking = createTestServiceAppointment({
        bookingReference: "BK-SERVICE1",
        status: "pending",
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      const cancelData = {
        bookingReference: "BK-SERVICE1",
        type: "service",
        reason: "Customer requested cancellation due to scheduling conflict",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(cancelData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("cancelled successfully");

      // Verify booking was updated
      const { serviceAppointments: serviceCollection, client: newClient } =
        await getTestCollections();
      const cancelledBooking = await serviceCollection.findOne({
        bookingReference: "BK-SERVICE1",
      });
      expect(cancelledBooking?.status).toBe("cancelled");
      expect(cancelledBooking?.cancellationReason).toBe(
        "Customer requested cancellation due to scheduling conflict"
      );
      expect(cancelledBooking?.cancelledAt).toBeDefined();
      await newClient.close();

      // Verify cancellation email was sent
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testBooking.customerInfo.email,
          subject: expect.stringContaining("BK-SERVICE1"),
        })
      );
    });

    it("should cancel car viewing booking successfully", async () => {
      // Create test car viewing booking
      const { carViewingBookings, client } = await getTestCollections();
      const testBooking = createTestCarViewingBooking({
        bookingReference: "BK-VIEWING1",
        status: "pending",
      });
      await carViewingBookings.insertOne(testBooking);
      await client.close();

      const cancelData = {
        bookingReference: "BK-VIEWING1",
        type: "viewing",
        reason: "Vehicle no longer available for viewing",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(cancelData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify booking was updated
      const { carViewingBookings: viewingCollection, client: newClient } =
        await getTestCollections();
      const cancelledBooking = await viewingCollection.findOne({
        bookingReference: "BK-VIEWING1",
      });
      expect(cancelledBooking?.status).toBe("cancelled");
      await newClient.close();
    });

    it("should return 401 for unauthenticated user", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const cancelData = {
        bookingReference: "BK-TEST1",
        type: "service",
        reason: "Test reason",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(cancelData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        bookingReference: "",
        type: "",
        reason: "",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should return 400 for short cancellation reason", async () => {
      const invalidData = {
        bookingReference: "BK-TEST1",
        type: "service",
        reason: "Short", // Less than 10 characters
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("at least 10 characters");
    });

    it("should return 404 for non-existent booking", async () => {
      const cancelData = {
        bookingReference: "BK-NOTFOUND",
        type: "service",
        reason: "This booking does not exist in the database",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(cancelData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Booking not found");
    });

    it("should return 400 for already cancelled booking", async () => {
      // Create already cancelled booking
      const { serviceAppointments, client } = await getTestCollections();
      const testBooking = createTestServiceAppointment({
        bookingReference: "BK-CANCELLED",
        status: "cancelled",
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      const cancelData = {
        bookingReference: "BK-CANCELLED",
        type: "service",
        reason: "Trying to cancel already cancelled booking",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(cancelData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Booking is already cancelled");
    });

    it("should return 400 for invalid booking type", async () => {
      const invalidData = {
        bookingReference: "BK-TEST1",
        type: "invalid-type",
        reason: "Testing invalid booking type handling",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid booking type");
    });
  });
});
