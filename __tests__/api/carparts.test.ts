/**
 * @jest-environment node
 *
 * Tests for /api/carparts route (src/app/api/carparts/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: GET all car parts, query param filtering, empty collection
 * - 🔒 Security: Proper error responses; public GET performs no DB writes
 * - 🎯 Usability: Meaningful response shape
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/carparts/route";
import { getTestCollections } from "../utils/testUtils";

describe("/api/carparts", () => {
  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  // ── Helper: insert car parts directly into the DB ───────────

  const createTestCarPart = (overrides = {}) => ({
    name: "Brake Pad Set",
    brand: "BMW",
    category: "Brakes",
    price: 89.99,
    image: "/images/parts/brake-pad.jpg",
    condition: "New" as const,
    compatibility: "BMW 3 Series (2018-2023)",
    description: "High-performance ceramic brake pads",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  // ── GET — Return all car parts ──────────────────────────────

  describe("GET", () => {
    it("should return all car parts from the database", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      const part1 = createTestCarPart({ name: "Brake Pad Set", brand: "BMW" });
      const part2 = createTestCarPart({
        name: "Oil Filter",
        brand: "Toyota",
        category: "Engine",
      });
      await carParts.insertMany([part1, part2]);
      await client.close();

      const request = new NextRequest("http://localhost:3000/api/carparts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should return response with correct shape", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      await carParts.insertOne(createTestCarPart());
      await client.close();

      const request = new NextRequest("http://localhost:3000/api/carparts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("data");
      expect(typeof data.success).toBe("boolean");
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should return car parts with all required fields", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      await carParts.insertOne(createTestCarPart());
      await client.close();

      const request = new NextRequest("http://localhost:3000/api/carparts");
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      const part = data.data[0];
      expect(part).toHaveProperty("name");
      expect(part).toHaveProperty("brand");
      expect(part).toHaveProperty("category");
      expect(part).toHaveProperty("price");
      expect(part).toHaveProperty("condition");
      expect(part).toHaveProperty("compatibility");
      expect(part).toHaveProperty("description");
      expect(part).toHaveProperty("inStock");
    });

    // ── Query param filtering ───────────────────────────────

    it("should filter by brand query parameter", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      await carParts.insertMany([
        createTestCarPart({ name: "BMW Brake Pad", brand: "BMW" }),
        createTestCarPart({ name: "Toyota Filter", brand: "Toyota" }),
        createTestCarPart({ name: "BMW Air Filter", brand: "BMW" }),
      ]);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/carparts?brand=BMW"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data.every((p: { brand: string }) => p.brand === "BMW")).toBe(
        true
      );
    });

    it("should filter by category query parameter", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      await carParts.insertMany([
        createTestCarPart({ name: "Brake Pad", category: "Brakes" }),
        createTestCarPart({ name: "Oil Filter", category: "Engine" }),
        createTestCarPart({ name: "Brake Disc", category: "Brakes" }),
      ]);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/carparts?category=Brakes"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(
        data.data.every((p: { category: string }) => p.category === "Brakes")
      ).toBe(true);
    });

    it("should filter by condition query parameter", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      await carParts.insertMany([
        createTestCarPart({ name: "New Part", condition: "New" }),
        createTestCarPart({ name: "Used Part", condition: "Used" }),
        createTestCarPart({
          name: "Refurbished Part",
          condition: "Refurbished",
        }),
      ]);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/carparts?condition=New"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].condition).toBe("New");
    });

    it("should support multiple filters together", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      await carParts.insertMany([
        createTestCarPart({
          name: "BMW New Brake",
          brand: "BMW",
          condition: "New",
        }),
        createTestCarPart({
          name: "BMW Used Brake",
          brand: "BMW",
          condition: "Used",
        }),
        createTestCarPart({
          name: "Toyota New Brake",
          brand: "Toyota",
          condition: "New",
        }),
      ]);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/carparts?brand=BMW&condition=New"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].brand).toBe("BMW");
      expect(data.data[0].condition).toBe("New");
    });

    // ── Empty collection (no seeding) ────────────────────────

    it("should return an empty array when the collection is empty", async () => {
      // Auto-seeding was removed: a public GET must never write to the DB.
      // An empty collection now returns []; real inventory is created via
      // the admin API (POST /api/admin/carparts).
      const request = new NextRequest("http://localhost:3000/api/carparts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    // ── Error handling ──────────────────────────────────────

    it("should return 500 when database throws an error", async () => {
      // Force an error by resetting modules and mocking the model
      jest.resetModules();
      jest.doMock("@/lib/models", () => ({
        getCarPartsCollection: jest
          .fn()
          .mockRejectedValue(new Error("DB connection failed")),
      }));
      const { GET: mockedGET } = require("@/app/api/carparts/route");

      const request = new NextRequest("http://localhost:3000/api/carparts");
      const response = await mockedGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
