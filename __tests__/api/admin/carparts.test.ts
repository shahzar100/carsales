/**
 * @jest-environment node
 *
 * Tests for /api/admin/carparts route (src/app/api/admin/carparts/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: CRUD operations for car parts
 * - 🔒 Security: Authentication enforcement, input validation
 * - 🎯 Usability: Meaningful error messages
 */
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "@/app/api/admin/carparts/route";
import { getTestCollections } from "../../utils/testUtils";

// Mock authentication
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  // Write routes (POST/PUT/DELETE) are role-gated with hasMinimumRole.
  hasMinimumRole: jest.fn(),
  // Mutating routes call getSession() for the audit log — must be mocked
  // or POST/PUT/DELETE throw `(0 , _auth.getSession) is not a function`.
  getSession: jest.fn(async () => ({ username: "test-admin" })),
}));

// next/cache's revalidatePath() requires a static-generation store that
// only exists during a real Next request — in jest it throws
// "Invariant: static generation store missing", which the mutating routes
// then surface as a 500. The DB writes / audit log still happen normally,
// so neutralising the cache hint is safe. (Mirrors cars.test.ts.)
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));
const {
  isAuthenticated: mockIsAuthenticated,
  hasMinimumRole: mockHasMinimumRole,
} = require("@/lib/utils/auth");

describe("/api/admin/carparts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
    mockHasMinimumRole.mockResolvedValue(true); // Default to manager/admin
  });

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

  // ── GET — List all car parts ────────────────────────────────

  describe("GET", () => {
    it("should return all car parts for authenticated admin", async () => {
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");

      const part1 = createTestCarPart({ name: "Brake Pad Set" });
      const part2 = createTestCarPart({ name: "Oil Filter", brand: "Toyota" });
      await carParts.insertMany([part1, part2]);
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should return 401 for unauthenticated user", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty array when no car parts exist", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it("should return 500 when GET throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB connection failed"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  // ── POST — Create a new car part ───────────────────────────

  describe("POST", () => {
    const validCarPartData = {
      name: "Performance Air Filter",
      brand: "K&N",
      category: "Engine",
      price: 54.99,
      image: "/images/parts/air-filter.jpg",
      condition: "New",
      compatibility: "Universal Fit",
      description: "High-flow performance air filter",
      inStock: true,
    };

    it("should create a new car part successfully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify(validCarPartData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Performance Air Filter");
      expect(data.data.brand).toBe("K&N");

      // Verify car part was saved to database
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");
      const savedPart = await carParts.findOne({
        name: "Performance Air Filter",
      });
      expect(savedPart).toBeTruthy();
      expect(savedPart?.brand).toBe("K&N");
      await client.close();
    });

    it("should return 400 when required fields are missing", async () => {
      const invalidData = {
        name: "",
        brand: "",
        // Missing category, price
      };

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 400 when name is missing", async () => {
      const missingName = { ...validCarPartData, name: "" };

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify(missingName),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 400 when price is missing", async () => {
      const missingPrice = { ...validCarPartData };
      delete (missingPrice as Record<string, unknown>).price;

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify(missingPrice),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 401 for unauthenticated user", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify(validCarPartData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when the session lacks the manager role", async () => {
      // Authenticated, but a read-only `staff` session.
      mockHasMinimumRole.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify(validCarPartData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toMatch(/manager/i);
    });

    it("should return 500 when POST throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify(validCarPartData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("returns 400 when category contains MongoDB operator characters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify({ ...validCarPartData, category: "{$where: 1}" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/Invalid category/i);
    });

    it("returns 400 when category contains $ sign", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "POST",
          body: JSON.stringify({ ...validCarPartData, category: "$where" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/Invalid category/i);
    });
  });

  // ── PUT — Update an existing car part ──────────────────────

  describe("PUT", () => {
    it("should update an existing car part successfully", async () => {
      // Create a car part first
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");
      const testPart = createTestCarPart({
        name: "Old Brake Pad",
        price: 79.99,
      });
      const result = await carParts.insertOne(testPart);
      const partId = result.insertedId.toString();
      await client.close();

      const updateData = {
        _id: partId,
        name: "Updated Brake Pad",
        brand: "BMW",
        category: "Brakes",
        price: 99.99,
        condition: "New",
        compatibility: "BMW 3 Series (2018-2023)",
        description: "Updated high-performance brake pads",
        inStock: true,
      };

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify car part was updated in database
      const { client: newClient } = await getTestCollections();
      const newDb = newClient.db("MMC");
      const updatedPart = await newDb
        .collection("carParts")
        .findOne({ _id: result.insertedId });
      expect(updatedPart?.name).toBe("Updated Brake Pad");
      expect(updatedPart?.price).toBe(99.99);
      await newClient.close();
    });

    it("should return 400 when _id is missing from PUT body", async () => {
      const updateData = {
        name: "Updated Part",
        brand: "BMW",
        category: "Brakes",
        price: 99.99,
      };

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 401 for unauthenticated PUT request", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "PUT",
          body: JSON.stringify({ _id: "test", name: "Updated" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when the session lacks the manager role", async () => {
      mockHasMinimumRole.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "PUT",
          body: JSON.stringify({
            _id: "507f1f77bcf86cd799439011",
            name: "Updated",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toMatch(/manager/i);
    });

    it("should reject a PUT body with a MongoDB-operator key", async () => {
      // `$set` spread into the update would be operator injection — the
      // strict schema + key scan must reject it before the DB write.
      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "PUT",
          body: JSON.stringify({
            _id: "507f1f77bcf86cd799439011",
            $set: { price: 0 },
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/invalid field names/i);
    });

    it("should reject a PUT body with an unknown field (strict schema)", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "PUT",
          body: JSON.stringify({
            _id: "507f1f77bcf86cd799439011",
            name: "Renamed",
            bogusField: "nope",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 500 when PUT throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts",
        {
          method: "PUT",
          body: JSON.stringify({ _id: "test", name: "Updated" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  // ── DELETE — Delete a car part ─────────────────────────────

  describe("DELETE", () => {
    it("should delete an existing car part successfully", async () => {
      // Create a car part first
      const { client } = await getTestCollections();
      const db = client.db("MMC");
      const carParts = db.collection("carParts");
      const testPart = createTestCarPart();
      const result = await carParts.insertOne(testPart);
      const partId = result.insertedId.toString();
      await client.close();

      const request = new NextRequest(
        `http://localhost:3000/api/admin/carparts?id=${partId}`
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify car part was deleted from database
      const { client: newClient } = await getTestCollections();
      const newDb = newClient.db("MMC");
      const deletedPart = await newDb
        .collection("carParts")
        .findOne({ _id: result.insertedId });
      expect(deletedPart).toBeNull();
      await newClient.close();
    });

    it("should return 400 when car part ID is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts"
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 401 for unauthenticated DELETE request", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts?id=507f1f77bcf86cd799439011"
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 when DELETE throws an error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        "http://localhost:3000/api/admin/carparts?id=507f1f77bcf86cd799439011"
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
