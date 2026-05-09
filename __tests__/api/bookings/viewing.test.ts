/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/viewing/route";
import { getTestCollections } from "../../utils/testUtils";

// Mock email sending
jest.mock("@/emails/send", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock the booking reference generator
jest.mock("@/lib/utils/booking", () => ({
  generateBookingReference: jest.fn().mockReturnValue("BK-VIEW123"),
}));

describe("/api/bookings/viewing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("POST", () => {
    const validBookingData = {
      carId: "507f1f77bcf86cd799439011",
      carDetails: {
        make: "Toyota",
        model: "Camry",
        year: 2023,
        price: 25000,
        image: "test-car.jpg",
      },
      customerInfo: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "555-0124",
      },
      appointmentDate: "2026-12-26",
      appointmentTime: "14:00",
      dealership: {
        location: "Main Branch",
        address: "123 Auto Street, City",
      },
    };

    it("should create a new car viewing booking successfully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(validBookingData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.3.1",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.bookingReference).toBe("BK-VIEW123");
      expect(data.data.message).toContain(
        "Car viewing booking created successfully"
      );

      // Verify booking was saved to database
      const { carViewingBookings, client } = await getTestCollections();
      const savedBooking = await carViewingBookings.findOne({
        bookingReference: "BK-VIEW123",
      });
      expect(savedBooking).toBeTruthy();
      expect(savedBooking?.customerInfo.name).toBe("Jane Doe");
      expect(savedBooking?.carId).toBe("507f1f77bcf86cd799439011");
      await client.close();
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
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.3.2",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Customer information is required");
    });

    it("should reject request with missing booking details", async () => {
      const invalidData = {
        customerInfo: validBookingData.customerInfo,
        carId: "",
        appointmentDate: "",
        appointmentTime: "",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.3.3",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Booking details are required");
    });

    it("should handle booking without dealership info", async () => {
      const dataWithoutDealership = {
        ...validBookingData,
        dealership: undefined,
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(dataWithoutDealership),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.3.4",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify booking was saved without dealership info
      const { carViewingBookings, client } = await getTestCollections();
      const savedBooking = await carViewingBookings.findOne({
        bookingReference: "BK-VIEW123",
      });
      expect(savedBooking?.dealership).toBeNull();
      await client.close();
    });

    it("should reject request with invalid email", async () => {
      const invalidData = {
        ...validBookingData,
        customerInfo: {
          name: "Jane Doe",
          email: "not-an-email",
          phone: "555-0124",
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.3.5",
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
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "abc",
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.2.1",
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
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.2.2",
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
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.2.3",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid appointment time");
    });

    it("should return 429 when rate limit is exceeded", async () => {
      // Make 6 requests (limit is 5 per minute) from same IP
      for (let i = 0; i < 5; i++) {
        const req = new NextRequest(
          "http://localhost:3000/api/bookings/viewing",
          {
            method: "POST",
            body: JSON.stringify(validBookingData),
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "192.168.2.200",
            },
          }
        );
        await POST(req);
      }

      // 6th request should be rate limited
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(validBookingData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.2.200",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Too many requests. Please try again later.");
    });

    it("should handle email send failure gracefully", async () => {
      const { sendEmail: mockSendEmailFn } = require("@/emails/send");
      mockSendEmailFn.mockResolvedValueOnce({
        success: false,
        error: "SMTP error",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: JSON.stringify(validBookingData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.3.300",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Booking should still succeed even if email fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 500 when an internal error occurs", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: "not valid json",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.4.400",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("returns 400 for malformed JSON body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/bookings/viewing",
        {
          method: "POST",
          body: "{",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.99",
          },
        }
      );
      jest
        .spyOn(request, "json")
        .mockRejectedValueOnce(new SyntaxError("Bad JSON"));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/Invalid JSON/i);
    });
  });
});
