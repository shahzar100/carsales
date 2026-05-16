/**
 * @jest-environment node
 *
 * Tests for /api/bookings/cancel (src/app/api/bookings/cancel/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: zod validation blocks NoSQL operator injection
 *   (`{"bookingReference": {"$gt": ""}}`); ownership check forbids
 *   cancelling another customer's booking; auth uses the customer
 *   Auth.js session, not the admin iron-session.
 * - 📋 Functional: owner with a valid reference + reason → 200, email
 *   sent in the background; service and viewing booking types both
 *   covered.
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/cancel/route";
import {
  getTestCollections,
  createTestServiceAppointment,
  createTestCarViewingBooking,
  flushWaitUntil,
} from "../../utils/testUtils";

// Customer auth — cancellation is a customer-initiated action. Mock the
// helper so each test controls who's "signed in". We import once and
// re-set the resolved value per test.
jest.mock("@/lib/utils/customerAuth", () => ({
  getCustomerIdentity: jest.fn(),
}));
const {
  getCustomerIdentity: mockGetCustomerIdentity,
} = require("@/lib/utils/customerAuth");

// Mock email sending
jest.mock("@/emails/send", () => ({
  sendEmail: jest.fn(),
}));
const { sendEmail: mockSendEmail } = require("@/emails/send");

describe("/api/bookings/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: signed in as the test fixture's owner email.
    mockGetCustomerIdentity.mockResolvedValue({
      email: "john@example.com",
      name: "John Doe",
    });
    mockSendEmail.mockResolvedValue({ success: true });
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("POST", () => {
    it("cancels a service booking when the owner requests it", async () => {
      const { serviceAppointments, client } = await getTestCollections();
      const testBooking = createTestServiceAppointment({
        bookingReference: "BK-SERV01",
        status: "pending",
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      const cancelData = {
        bookingReference: "BK-SERV01",
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

      const { serviceAppointments: serviceCollection, client: newClient } =
        await getTestCollections();
      const cancelledBooking = await serviceCollection.findOne({
        bookingReference: "BK-SERV01",
      });
      expect(cancelledBooking?.status).toBe("cancelled");
      expect(cancelledBooking?.cancellationReason).toBe(
        "Customer requested cancellation due to scheduling conflict"
      );
      expect(cancelledBooking?.cancelledAt).toBeDefined();
      await newClient.close();

      await flushWaitUntil();

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testBooking.customerInfo.email,
          subject: expect.stringContaining("BK-SERV01"),
        })
      );
    });

    it("cancels a viewing booking when the owner requests it", async () => {
      const { carViewingBookings, client } = await getTestCollections();
      const testBooking = createTestCarViewingBooking({
        bookingReference: "BK-VIEW01",
        status: "pending",
      });
      await carViewingBookings.insertOne(testBooking);
      await client.close();

      // Owner of the viewing fixture is jane@example.com.
      mockGetCustomerIdentity.mockResolvedValue({
        email: "jane@example.com",
        name: "Jane Doe",
      });

      const cancelData = {
        bookingReference: "BK-VIEW01",
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

      const { carViewingBookings: viewingCollection, client: newClient } =
        await getTestCollections();
      const cancelledBooking = await viewingCollection.findOne({
        bookingReference: "BK-VIEW01",
      });
      expect(cancelledBooking?.status).toBe("cancelled");
      await newClient.close();
    });

    it("🔒 returns 401 when no customer is signed in", async () => {
      mockGetCustomerIdentity.mockResolvedValue(null);

      const cancelData = {
        bookingReference: "BK-TST001",
        type: "service",
        reason: "Test reason that is at least ten characters long",
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

    it("🔒 rejects NoSQL operator injection in bookingReference with 400", async () => {
      // The classic shape: an attacker swaps the string for a Mongo
      // operator object. With the zod regex this never reaches the DB.
      const injection = {
        bookingReference: { $gt: "" },
        type: "service",
        reason: "Trying to bypass with a Mongo operator injection",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: JSON.stringify(injection),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/bookingReference/i);
    });

    it("🔒 returns 403 when the booking belongs to another customer", async () => {
      const { serviceAppointments, client } = await getTestCollections();
      const testBooking = createTestServiceAppointment({
        bookingReference: "BK-OTH001",
        status: "pending",
        customerInfo: {
          name: "Someone Else",
          email: "someone-else@example.com",
          phone: "555-9999",
        },
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      // Signed in as john@example.com (default), but the booking is owned
      // by someone-else@example.com.
      const cancelData = {
        bookingReference: "BK-OTH001",
        type: "service",
        reason: "Attempting to cancel another customer's booking",
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

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");

      // No write happened.
      const { serviceAppointments: col, client: c2 } = await getTestCollections();
      const after = await col.findOne({ bookingReference: "BK-OTH001" });
      expect(after?.status).toBe("pending");
      await c2.close();

      // And no email was sent.
      await flushWaitUntil();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("returns 400 for missing required fields", async () => {
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
      expect(data.error).toMatch(/invalid/i);
    });

    it("returns 400 for short cancellation reason", async () => {
      const invalidData = {
        bookingReference: "BK-TST002",
        type: "service",
        reason: "Short",
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

    it("returns 404 for non-existent booking", async () => {
      const cancelData = {
        bookingReference: "BK-NOFIND",
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

    it("returns 400 for an already-cancelled booking the owner re-cancels", async () => {
      const { serviceAppointments, client } = await getTestCollections();
      const testBooking = createTestServiceAppointment({
        bookingReference: "BK-CAN001",
        status: "cancelled",
      });
      await serviceAppointments.insertOne(testBooking);
      await client.close();

      const cancelData = {
        bookingReference: "BK-CAN001",
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

    it("returns 400 for an invalid booking type", async () => {
      const invalidData = {
        bookingReference: "BK-TST003",
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
      // Either the zod enum rejects it, or the route's switch returns
      // "Invalid booking type" — both are correct rejection paths.
      expect(data.error).toMatch(/invalid|booking type/i);
    });

    it("returns 400 for malformed JSON", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/cancel",
        {
          method: "POST",
          body: "not valid json",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid JSON body");
    });
  });
});
