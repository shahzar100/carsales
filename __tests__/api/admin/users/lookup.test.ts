/**
 * @jest-environment node
 *
 * Tests for /api/admin/users/lookup route (src/app/api/admin/users/lookup/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: Lookup user by username or email
 * - 🔒 Security: Input validation, never returns password hash
 * - 🎯 Usability: Proper error messages
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/users/lookup/route";
import { getTestCollections } from "../../../utils/testUtils";
import bcrypt from "bcryptjs";

// Mock authentication
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
}));
const { isAuthenticated: mockIsAuthenticated } = require("@/lib/utils/auth");

describe("/api/admin/users/lookup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("GET", () => {
    it("should find a user by username", async () => {
      const { adminUsers, client } = await getTestCollections();
      const passwordHash = await bcrypt.hash("test-password", 10);
      await adminUsers.insertOne({
        username: "testadmin",
        email: "admin@test.com",
        role: "admin",
        passwordHash,
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/lookup?q=testadmin"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe("testadmin");
      expect(data.user.email).toBe("admin@test.com");
      expect(data.user.role).toBe("admin");
    });

    it("should find a user by email (case-insensitive)", async () => {
      const { adminUsers, client } = await getTestCollections();
      await adminUsers.insertOne({
        username: "testadmin",
        email: "admin@test.com",
        role: "admin",
        passwordHash: "hashed",
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/lookup?q=ADMIN@TEST.COM"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe("testadmin");
    });

    it("should never return the password hash", async () => {
      const { adminUsers, client } = await getTestCollections();
      await adminUsers.insertOne({
        username: "testadmin",
        email: "admin@test.com",
        role: "admin",
        passwordHash: "secret-hash",
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/lookup?q=testadmin"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.user.passwordHash).toBeUndefined();
      expect(data.user.password).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain("secret-hash");
    });

    it("should return 400 when query parameter is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/lookup"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should return 400 for empty query parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/lookup?q="
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should return 404 when user not found", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/lookup?q=nonexistent"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("No user found");
    });
  });
});
