/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/bookings/viewing/route";
import { getTestCollections } from "../../utils/testUtils";

// Mock the email client
jest.mock("@/lib/email/client", () => ({
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
      appointmentDate: "2024-12-26",
      appointmentTime: "2:00 PM",
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
      expect(savedBooking?.dealership).toBeUndefined();
      await client.close();
    });
  });
});
