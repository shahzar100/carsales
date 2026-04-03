/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/admin/shop/route";
import { getTestCollections, createTestShopInfo } from "../../utils/testUtils";

// Mock authentication
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
}));
const { isAuthenticated: mockIsAuthenticated } = require("@/lib/utils/auth");

describe("/api/admin/shop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("GET", () => {
    it("should return shop info when it exists", async () => {
      const { shopInfo, client } = await getTestCollections();
      const testShopInfo = createTestShopInfo();
      await shopInfo.insertOne(testShopInfo);
      await client.close();

      const request = new NextRequest("http://localhost:3000/api/admin/shop");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.businessName).toBe(testShopInfo.businessName);
    });

    it("should return seed data when no shop info exists", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/shop");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Auto-seeding should populate the collection with default data
      expect(data.data).not.toBeNull();
      expect(data.data.businessName).toBeDefined();
      expect(data.data.phone).toBeDefined();
    });

    it("should return 401 for unauthenticated user", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/admin/shop");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe(
        "Authentication required to access business settings"
      );
    });

    it("should return 500 when GET throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB connection failed"));

      const request = new NextRequest("http://localhost:3000/api/admin/shop");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to retrieve business information");
    });
  });

  describe("PUT", () => {
    const validShopData = {
      businessName: "Updated Motor Company",
      address: "New Address 456",
      city: "Updated City",
      state: "Updated State",
      zipCode: "54321",
      phone: "555-999-8888",
      email: "updated@motor.com",
      hours: {
        monday: "8:00 AM - 7:00 PM",
        tuesday: "8:00 AM - 7:00 PM",
        wednesday: "8:00 AM - 7:00 PM",
        thursday: "8:00 AM - 7:00 PM",
        friday: "8:00 AM - 7:00 PM",
        saturday: "9:00 AM - 5:00 PM",
        sunday: "Closed",
      },
      description: "Updated dealership description",
      socialMedia: {
        facebook: "updated-facebook",
        twitter: "updated-twitter",
        instagram: "updated-instagram",
      },
    };

    it("should update shop info successfully", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/shop", {
        method: "PUT",
        body: JSON.stringify(validShopData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.businessName).toBe("Updated Motor Company");
      expect(data.data.phone).toBe("555-999-8888");

      // Verify shop info was saved/updated in database
      const { shopInfo, client } = await getTestCollections();
      const savedShopInfo = await shopInfo.findOne({});
      expect(savedShopInfo?.businessName).toBe("Updated Motor Company");
      expect(savedShopInfo?.address).toBe("New Address 456");
      await client.close();
    });

    it("should create new shop info if none exists (upsert)", async () => {
      // Ensure no shop info exists
      const { shopInfo, client } = await getTestCollections();
      await shopInfo.deleteMany({});
      await client.close();

      const request = new NextRequest("http://localhost:3000/api/admin/shop", {
        method: "PUT",
        body: JSON.stringify(validShopData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify new shop info was created
      const { shopInfo: shopInfoCollection, client: newClient } =
        await getTestCollections();
      const shopInfoCount = await shopInfoCollection.countDocuments();
      expect(shopInfoCount).toBe(1);
      await newClient.close();
    });

    it("should handle shop info with minimal required fields", async () => {
      const minimalShopData = {
        businessName: "Minimal Motor",
        address: "Minimal Address",
        city: "Minimal City",
        state: "MS",
        zipCode: "00000",
        phone: "000-000-0000",
        email: "minimal@motor.com",
        hours: {
          monday: "9-5",
          tuesday: "9-5",
          wednesday: "9-5",
          thursday: "9-5",
          friday: "9-5",
          saturday: "Closed",
          sunday: "Closed",
        },
      };

      const request = new NextRequest("http://localhost:3000/api/admin/shop", {
        method: "PUT",
        body: JSON.stringify(minimalShopData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.businessName).toBe("Minimal Motor");
      expect(data.data.description).toBe(""); // Should default to empty string
    });

    it("should return 401 for unauthenticated user", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest("http://localhost:3000/api/admin/shop", {
        method: "PUT",
        body: JSON.stringify(validShopData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe(
        "Authentication required to update business settings"
      );
    });

    it("should handle malformed JSON gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/shop", {
        method: "PUT",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid JSON in request body — could not parse the data"
      );
    });

    it("should return 500 when update throws an error", async () => {
      // Use jest.resetModules + doMock to override updateBusinessInfo
      jest.resetModules();
      jest.doMock("@/lib/utils/businessInfo", () => ({
        getBusinessInfo: jest.fn().mockRejectedValue(new Error("DB error")),
        updateBusinessInfo: jest
          .fn()
          .mockRejectedValue(new Error("DB write error")),
      }));
      // Re-mock auth since resetModules clears it
      jest.doMock("@/lib/utils/auth", () => ({
        isAuthenticated: jest.fn().mockResolvedValue(true),
      }));
      jest.doMock("@/lib/models", () => {
        const actual = jest.requireActual("@/lib/models");
        return actual;
      });
      const { PUT: mockedPUT } = require("@/app/api/admin/shop/route");

      const request = new NextRequest("http://localhost:3000/api/admin/shop", {
        method: "PUT",
        body: JSON.stringify(validShopData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await mockedPUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Database update failed");

      jest.restoreAllMocks();
    });
  });
});
