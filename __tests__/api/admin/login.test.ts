/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/login/route";
import { getTestCollections, createTestAdminUser } from "../../utils/testUtils";
import bcrypt from "bcryptjs";

describe("/api/admin/login", () => {
  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("POST", () => {
    it("should login successfully with valid credentials", async () => {
      // Create test admin user
      await createTestAdminUser();

      const loginData = {
        username: "testadmin",
        password: "test-admin-password",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Login successful");
    });

    it("should reject login with invalid username", async () => {
      await createTestAdminUser();

      const loginData = {
        username: "wronguser",
        password: "test-admin-password",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should reject login with invalid password", async () => {
      await createTestAdminUser();

      const loginData = {
        username: "testadmin",
        password: "wrong-password",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should reject login with missing credentials", async () => {
      const loginData = {
        username: "",
        password: "",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Username and password are required");
    });

    it("should update lastLogin timestamp on successful login", async () => {
      await createTestAdminUser();

      const loginData = {
        username: "testadmin",
        password: "test-admin-password",
      };

      const request = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      // Verify lastLogin was updated
      const { adminUsers, client } = await getTestCollections();
      const updatedUser = await adminUsers.findOne({ username: "testadmin" });
      expect(updatedUser?.lastLogin).toBeDefined();
      await client.close();
    });
  });
});
