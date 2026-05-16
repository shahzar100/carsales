/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "@/app/api/admin/cars/route";
import { getTestCollections, createTestCar } from "../../utils/testUtils";

// Mock authentication. Routes also call `getSession()` for audit logging —
// without that mock, every mutating path throws
// `(0 , _auth.getSession) is not a function` and returns 500.
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  getSession: jest.fn(async () => ({ username: "test-admin" })),
}));

// next/cache's revalidatePath() requires a static-generation store that
// only exists during a real Next request — in jest it throws
// "Invariant: static generation store missing". The route's audit-log /
// DB writes still happen normally, so neutralising the cache hint is safe.
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));
const { isAuthenticated: mockIsAuthenticated } = require("@/lib/utils/auth");

describe("/api/admin/cars", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("GET", () => {
    it("should return all cars for authenticated admin", async () => {
      // Seed database with test cars
      const { cars, client } = await getTestCollections();
      const testCar1 = createTestCar({ make: "Toyota", model: "Camry" });
      const testCar2 = createTestCar({ make: "Honda", model: "Civic" });
      await cars.insertMany([testCar1, testCar2]);
      await client.close();

      const request = new NextRequest("http://localhost:3000/api/admin/cars");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].make).toBe("Toyota");
      expect(data.data[1].make).toBe("Honda");
    });

    it("should return 401 for unauthenticated user", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/admin/cars");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty array when no cars exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/cars");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it("should filter cars by status parameter", async () => {
      const { cars, client } = await getTestCollections();
      const availableCar = createTestCar({
        make: "Toyota",
        status: "available",
      });
      const soldCar = createTestCar({ make: "Honda", status: "sold" });
      await cars.insertMany([availableCar, soldCar]);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/cars?status=available"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].make).toBe("Toyota");
    });

    it("returns 400 for invalid status query param", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/cars?status=malicious_value"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/Invalid status value/i);
    });

    it.each(["available", "sold", "reserved"])(
      "accepts valid status query param: %s",
      async (validStatus) => {
        const request = new NextRequest(
          `http://localhost:3000/api/admin/cars?status=${validStatus}`
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    );

    it("should return 500 when database throws error", async () => {
      // Force an error by making isAuthenticated throw
      mockIsAuthenticated.mockRejectedValue(new Error("DB connection failed"));

      const request = new NextRequest("http://localhost:3000/api/admin/cars");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("POST", () => {
    const validCarData = {
      make: "BMW",
      model: "X5",
      year: 2023,
      price: 45000,
      mileage: 5000,
      fuel: "Petrol",
      transmission: "Automatic",
      doors: 5,
      colour: "Black",
      description: "Luxury SUV",
      features: ["Navigation", "Leather Seats"],
      status: "available",
    };

    it("should create a new car successfully", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "POST",
        body: JSON.stringify(validCarData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.make).toBe("BMW");
      expect(data.data.model).toBe("X5");

      // Verify car was saved to database
      const { cars, client } = await getTestCollections();
      const savedCar = await cars.findOne({ make: "BMW", model: "X5" });
      expect(savedCar).toBeTruthy();
      await client.close();
    });

    it("should return 400 when required fields are missing", async () => {
      const invalidCarData = {
        make: "",
        model: "",
        // Missing other required fields
      };

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "POST",
        body: JSON.stringify(invalidCarData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 401 for unauthenticated user", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "POST",
        body: JSON.stringify(validCarData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 when POST throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "POST",
        body: JSON.stringify(validCarData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("PUT", () => {
    it("should update an existing car successfully", async () => {
      // Create a car first
      const { cars, client } = await getTestCollections();
      const testCar = createTestCar({ make: "Toyota", price: 20000 });
      const result = await cars.insertOne(testCar);
      const carId = result.insertedId.toString();
      await client.close();

      const updateData = {
        _id: carId,
        make: "Toyota",
        model: "Updated Camry",
        price: 22000,
        year: 2023,
        mileage: 15000,
        fuel: "Petrol",
        transmission: "Automatic",
        doors: 4,
        colour: "Blue",
        status: "available",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "PUT",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify car was updated
      const { cars: carsCollection, client: newClient } =
        await getTestCollections();
      const updatedCar = await carsCollection.findOne({
        _id: result.insertedId,
      });
      expect(updatedCar?.model).toBe("Updated Camry");
      expect(updatedCar?.price).toBe(22000);
      await newClient.close();
    });

    it("should return 404 when trying to update non-existent car", async () => {
      const updateData = {
        _id: "507f1f77bcf86cd799439011", // Valid ObjectId format but doesn't exist
        make: "Toyota",
        model: "Camry",
        year: 2023,
        price: 20000,
        mileage: 15000,
        fuel: "Petrol",
        transmission: "Automatic",
        doors: 4,
        colour: "White",
        status: "available",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "PUT",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Car not found");
    });

    it("should return 400 when _id is missing from PUT body", async () => {
      const updateData = {
        make: "Toyota",
        model: "Camry",
        year: 2023,
        price: 20000,
        mileage: 15000,
        fuel: "Petrol",
        transmission: "Automatic",
        doors: 4,
        colour: "White",
        status: "available",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "PUT",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or missing car ID");
    });

    it("should return 401 for unauthenticated PUT request", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "PUT",
        body: JSON.stringify({ _id: "test", make: "Toyota" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 when PUT throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/admin/cars", {
        method: "PUT",
        body: JSON.stringify({ _id: "test", make: "Toyota" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("DELETE", () => {
    it("should delete an existing car successfully", async () => {
      // Create a car first
      const { cars, client } = await getTestCollections();
      const testCar = createTestCar();
      const result = await cars.insertOne(testCar);
      const carId = result.insertedId.toString();
      await client.close();

      const request = new NextRequest(
        `http://localhost:3000/api/admin/cars?id=${carId}`
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify car was deleted
      const { cars: carsCollection, client: newClient } =
        await getTestCollections();
      const deletedCar = await carsCollection.findOne({
        _id: result.insertedId,
      });
      expect(deletedCar).toBeNull();
      await newClient.close();
    });

    it("should return 400 when car ID is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/cars");
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or missing car ID");
    });

    it("should return 404 when trying to delete non-existent car", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/cars?id=507f1f77bcf86cd799439011"
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Car not found");
    });

    it("should return 401 for unauthenticated DELETE request", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/cars?id=507f1f77bcf86cd799439011"
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 when DELETE throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/cars?id=507f1f77bcf86cd799439011"
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
