/**
 * @jest-environment node
 * 
 * Tests for admin users API (src/app/api/admin/users/route.ts)
 * 
 * Standards coverage:
 * - 🔒 Security: User creation validation, duplicate prevention, password generation
 * - 📋 Functional: User management operations
 * - 🎯 Usability: Proper error messages for user feedback
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/users/route";
import { getTestCollections } from "../../utils/testUtils";

// Mock password hashing for predictable tests
jest.mock("@/lib/utils/auth", () => ({
  hashPassword: jest.fn((pwd: string) => Promise.resolve(`hashed_${pwd}`)),
  isAuthenticated: jest.fn(),
}));
const { isAuthenticated: mockIsAuthenticated } = require("@/lib/utils/auth");

describe("/api/admin/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
  });

  afterEach(async () => {
    const { adminUsers, client } = await getTestCollections();
    await adminUsers.deleteMany({});
    await client.close();
  });

  describe("🔒 Security Standards - Input Validation", () => {
    describe("POST - Username validation", () => {
      it("should reject missing username", async () => {
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            role: "staff",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Username is required");
      });

      it("should reject null username", async () => {
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            username: null,
            email: "test@example.com",
            role: "staff",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Username is required");
      });

      it("should reject username shorter than 3 characters", async () => {
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            username: "ab",
            email: "test@example.com",
            role: "staff",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("at least 3 characters");
      });

      it("should reject username with special characters", async () => {
        const invalidUsernames = [
          "user@name",
          "user-name",
          "user.name",
          "user name",
          "user!name",
          "user#name",
        ];

        for (const username of invalidUsernames) {
          const request = new NextRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({
              username,
              email: "test@example.com",
              role: "staff",
            }),
          });

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toContain("letters, numbers, and underscores");
        }
      });

      it("should accept valid usernames", async () => {
        const validUsernames = ["user123", "test_user", "USER_NAME", "user_123_test"];

        for (const username of validUsernames) {
          const request = new NextRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({
              username,
              email: `${username}@example.com`,
              role: "staff",
            }),
          });

          const response = await POST(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe("POST - Email validation", () => {
      it("should reject missing email", async () => {
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            username: "testuser",
            role: "staff",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("email address is required");
      });

      it("should reject invalid email formats", async () => {
        const invalidEmails = [
          "notanemail",
          "@example.com",
          "user@",
          "user@.com",
          "user @example.com",
          "user@example",
        ];

        for (const email of invalidEmails) {
          const request = new NextRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({
              username: "testuser",
              email,
              role: "staff",
            }),
          });

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toContain("valid email address");
        }
      });

      it("should accept valid email formats", async () => {
        const validEmails = [
          "user@example.com",
          "test.user@example.com",
          "user+tag@example.co.uk",
          "user123@subdomain.example.com",
        ];

        for (let i = 0; i < validEmails.length; i++) {
          const email = validEmails[i];
          const request = new NextRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({
              username: `user_valid_${i}_${Date.now()}`,
              email,
              role: "staff",
            }),
          });

          const response = await POST(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe("POST - Role validation", () => {
      it("should reject missing role", async () => {
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            username: "testuser",
            email: "test@example.com",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("staff, manager, admin");
      });

      it("should reject invalid roles", async () => {
        const invalidRoles = ["superadmin", "user", "guest", "moderator", ""];

        for (const role of invalidRoles) {
          const request = new NextRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({
              username: "testuser",
              email: "test@example.com",
              role,
            }),
          });

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toContain("staff, manager, admin");
        }
      });

      it("should accept valid roles", async () => {
        const validRoles = ["staff", "manager", "admin"];

        for (const role of validRoles) {
          const request = new NextRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({
              username: `user_${role}`,
              email: `${role}@example.com`,
              role,
            }),
          });

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
        }
      });
    });

    describe("POST - Duplicate prevention", () => {
      it("should prevent duplicate usernames", async () => {
        const { adminUsers } = await getTestCollections();
        
        // Create first user
        await adminUsers.insertOne({
          username: "existinguser",
          email: "first@example.com",
          passwordHash: "hash123",
          role: "staff",
          createdAt: new Date(),
        });

        // Attempt to create user with same username
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            username: "existinguser",
            email: "different@example.com",
            role: "staff",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain("username already exists");
      });

      it("should prevent duplicate emails", async () => {
        const { adminUsers } = await getTestCollections();
        
        // Create first user
        await adminUsers.insertOne({
          username: "firstuser",
          email: "duplicate@example.com",
          passwordHash: "hash123",
          role: "staff",
          createdAt: new Date(),
        });

        // Attempt to create user with same email
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            username: "differentuser",
            email: "duplicate@example.com",
            role: "staff",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain("email already exists");
      });
    });
  });

  describe("📋 Functional Correctness Standards", () => {
    it("should create a new user successfully", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "newuser",
          email: "newuser@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("created successfully");
      expect(data.password).toBeDefined();
    });

    it("should return generated password in response", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "pwdtest",
          email: "pwd@example.com",
          role: "manager",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.password).toBeDefined();
      expect(typeof data.password).toBe("string");
      expect(data.password.length).toBeGreaterThan(0);
    });

    it("should save user to database with correct fields", async () => {
      const { adminUsers } = await getTestCollections();
      
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "dbtest",
          email: "dbtest@example.com",
          role: "admin",
        }),
      });

      await POST(request);

      const savedUser = await adminUsers.findOne({ username: "dbtest" });
      
      expect(savedUser).toBeDefined();
      expect(savedUser?.username).toBe("dbtest");
      expect(savedUser?.email).toBe("dbtest@example.com");
      expect(savedUser?.role).toBe("admin");
      expect(savedUser?.passwordHash).toBeDefined();
      expect(savedUser?.createdAt).toBeInstanceOf(Date);
    });

    it("should hash password before storing", async () => {
      const { adminUsers } = await getTestCollections();
      const { hashPassword } = require("@/lib/utils/auth");
      
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "hashtest",
          email: "hash@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const savedUser = await adminUsers.findOne({ username: "hashtest" });
      
      // Password should not be stored in plain text
      expect(savedUser?.passwordHash).not.toBe(data.password);
      // Hash function should have been called
      expect(hashPassword).toHaveBeenCalled();
    });
  });

  describe("🔒 Security Standards - Password Generation", () => {
    it("should generate strong password with proper format", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "strongpwd",
          email: "strong@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Password should be in format: xxxx-xxxx-xxxx-xxxx
      expect(data.password).toMatch(/^[A-Za-z0-9!@#$%&*]{4}-[A-Za-z0-9!@#$%&*]{4}-[A-Za-z0-9!@#$%&*]{4}-[A-Za-z0-9!@#$%&*]{4}$/);
    });

    it("should generate unique passwords for each user", async () => {
      const passwords = new Set();

      for (let i = 0; i < 10; i++) {
        const request = new NextRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            username: `user${i}`,
            email: `user${i}@example.com`,
            role: "staff",
          }),
        });

        const response = await POST(request);
        const data = await response.json();
        passwords.add(data.password);
      }

      expect(passwords.size).toBe(10);
    });
  });

  describe("🎯 Usability Standards - Error Messages", () => {
    it("should provide clear error for missing fields", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.length).toBeGreaterThan(0);
    });

    it("should provide specific error for duplicate username", async () => {
      const { adminUsers } = await getTestCollections();
      
      await adminUsers.insertOne({
        username: "duplicate",
        email: "first@example.com",
        passwordHash: "hash",
        role: "staff",
        createdAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "duplicate",
          email: "second@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toContain("username");
      expect(data.error.toLowerCase()).toContain("already exists");
    });

    it("should provide specific error for duplicate email", async () => {
      const { adminUsers } = await getTestCollections();
      
      await adminUsers.insertOne({
        username: "first",
        email: "duplicate@example.com",
        passwordHash: "hash",
        role: "staff",
        createdAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "second",
          email: "duplicate@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toContain("email");
      expect(data.error.toLowerCase()).toContain("already exists");
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: "invalid json {",
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it("should handle empty request body", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: "",
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle extremely long usernames", async () => {
      const longUsername = "a".repeat(1000);
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: longUsername,
          email: "test@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      // Should either accept or reject gracefully
      expect([200, 400]).toContain(response.status);
    });

    it("should handle unicode characters in username", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "user名前",
          email: "test@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should handle SQL injection attempts in username", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "admin'; DROP TABLE users; --",
          email: "test@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should handle NoSQL injection attempts", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: { $ne: null },
          email: "test@example.com",
          role: "staff",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
