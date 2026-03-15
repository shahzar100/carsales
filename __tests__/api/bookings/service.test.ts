/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/service/route";
import { getTestCollections } from "../../utils/testUtils";

// Mock email sending
jest.mock("@/emails/send", () => ({
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
      appointmentDate: "2026-12-25",
      appointmentTime: "10:00",
    };

    it("should create a new service booking successfully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(validBookingData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.1",
          },
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
      const { sendEmail: mockSendEmail } = require("@/emails/send");
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
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.2",
          },
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
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.3",
          },
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
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.4",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify email was called with default shop info
      const { sendEmail: mockSendEmailFn } = require("@/emails/send");
      expect(mockSendEmailFn).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "john@example.com",
          subject: expect.stringContaining("BK-TEST123"),
        })
      );
    });

    it("should handle malformed JSON gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: "invalid json",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.5",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should reject request with invalid email", async () => {
      const invalidData = {
        ...validBookingData,
        customerInfo: {
          name: "John Doe",
          email: "not-an-email",
          phone: "555-0123",
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.1.1",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid email address");
    });

    it("should reject request with invalid phone number", async () => {
      const invalidData = {
        ...validBookingData,
        customerInfo: {
          name: "John Doe",
          email: "john@example.com",
          phone: "abc",
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.1.2",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid phone number");
    });

    it("should reject request with past appointment date", async () => {
      const invalidData = {
        ...validBookingData,
        appointmentDate: "2020-01-01",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.1.3",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Appointment date must be in the future and within one year"
      );
    });

    it("should reject request with invalid appointment time", async () => {
      const invalidData = {
        ...validBookingData,
        appointmentTime: "13:00",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.1.4",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid appointment time");
    });

    it("should return 429 when rate limit is exceeded", async () => {
      // Make 6 requests (limit is 5 per minute)
      for (let i = 0; i < 5; i++) {
        const req = new NextRequest(
          "http://localhost:3000/api/bookings/service",
          {
            method: "POST",
            body: JSON.stringify(validBookingData),
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "192.168.1.100",
            },
          }
        );
        await POST(req);
      }

      // 6th request should be rate limited
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/service",
        {
          method: "POST",
          body: JSON.stringify(validBookingData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.1.100",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Too many requests. Please try again later.");
    });
  });
});
