/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/service/route";
import {
  getTestCollections,
  createTestServiceAppointment,
  mockSendEmail,
} from "../../utils/testUtils";

// Mock the email client
jest.mock("@/lib/email/client", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock the booking reference generator
jest.mock("@/lib/utils/booking", () => ({
  generateBookingReference: jest.fn().mockReturnValue("BK-TEST123"),
}));

describe("/api/bookings/service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("POST", () => {
    const validBookingData = {
      customerInfo: {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-0123",
      },
      serviceType: "Oil Change",
      serviceDetails: "Regular maintenance",
      appointmentDate: "2024-12-25",
      appointmentTime: "10:00 AM",
    };

    it("should create a new service booking successfully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(validBookingData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.bookingReference).toBe("BK-TEST123");
      expect(data.data.message).toContain(
        "Service booking created successfully"
      );

      // Verify booking was saved to database
      const { serviceAppointments, client } = await getTestCollections();
      const savedBooking = await serviceAppointments.findOne({
        bookingReference: "BK-TEST123",
      });
      expect(savedBooking).toBeTruthy();
      expect(savedBooking?.customerInfo.name).toBe("John Doe");
      expect(savedBooking?.serviceType).toBe("Oil Change");
      await client.close();

      // Verify email was sent
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "john@example.com",
          subject: expect.stringContaining("BK-TEST123"),
        })
      );
    });

    it("should reject request with missing customer info", async () => {
      const invalidData = {
        ...validBookingData,
        customerInfo: {
          name: "",
          email: "",
          phone: "",
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Customer information is required");
    });

    it("should reject request with missing service details", async () => {
      const invalidData = {
        customerInfo: validBookingData.customerInfo,
        serviceType: "",
        appointmentDate: "",
        appointmentTime: "",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Service details are required");
    });

    it("should use default shop info when no shop info in database", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(validBookingData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify email was called with default shop info
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            process.env.NEXT_BUSINESS_NAME || "Test Motor Company"
          ),
        })
      );
    });

    it("should handle malformed JSON gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: "invalid json",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
