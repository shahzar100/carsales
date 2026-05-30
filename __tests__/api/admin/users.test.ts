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

// Mock password hashing and auth for predictable tests
jest.mock("@/lib/utils/auth", () => ({
  hashPassword: jest.fn((pwd: string) => Promise.resolve(`hashed_${pwd}`)),
  isAuthenticated: jest.fn(),
  hasMinimumRole: jest.fn(),
  // POST / user-creation calls getSession() for the audit log; without
  // this mock every "happy path" assertion gets a 500 from
  // `(0 , _auth.getSession) is not a function`.
  getSession: jest.fn(async () => ({ username: "test-admin" })),
}));
const {
  isAuthenticated: mockIsAuthenticated,
  hasMinimumRole: mockHasMinimumRole,
} = require("@/lib/utils/auth");

// Mock rate limiter to prevent test interference from in-memory state.
// `check` and `reset` are now async on the real implementation.
jest.mock("@/lib/utils/rateLimit", () => ({
  createRateLimiter: () => ({
    check: jest
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 }),
    reset: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe("/api/admin/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
    mockHasMinimumRole.mockResolvedValue(true); // Default to manager/admin role
  });

  afterEach(async () => {
    const { adminUsers, client } = await getTestCollections();
    await adminUsers.deleteMany({});
    await client.close();
  });

  describe("🔒 Security Standards - Input Validation", () => {
    describe("POST - Username validation", () => {
      it("should reject missing username", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              email: "test@example.com",
              role: "staff",
            }),
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Username is required");
      });

      it("should reject null username", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: null,
              email: "test@example.com",
              role: "staff",
            }),
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Username is required");
      });

      it("should reject username shorter than 3 characters", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: "ab",
              email: "test@example.com",
              role: "staff",
            }),
          }
        );

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
          const request = new NextRequest(
            "http://localhost:3000/api/admin/users",
            {
              method: "POST",
              body: JSON.stringify({
                username,
                email: "test@example.com",
                role: "staff",
              }),
            }
          );

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toContain("letters, numbers, and underscores");
        }
      });

      it("should accept valid usernames", async () => {
        const validUsernames = [
          "user123",
          "test_user",
          "USER_NAME",
          "user_123_test",
        ];

        for (const username of validUsernames) {
          const request = new NextRequest(
            "http://localhost:3000/api/admin/users",
            {
              method: "POST",
              body: JSON.stringify({
                username,
                email: `${username}@example.com`,
                role: "staff",
              }),
            }
          );

          const response = await POST(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe("POST - Email validation", () => {
      it("should reject missing email", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: "testuser",
              role: "staff",
            }),
          }
        );

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
          const request = new NextRequest(
            "http://localhost:3000/api/admin/users",
            {
              method: "POST",
              body: JSON.stringify({
                username: "testuser",
                email,
                role: "staff",
              }),
            }
          );

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
          const request = new NextRequest(
            "http://localhost:3000/api/admin/users",
            {
              method: "POST",
              body: JSON.stringify({
                username: `user_valid_${i}_${Date.now()}`,
                email,
                role: "staff",
              }),
            }
          );

          const response = await POST(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe("POST - Role validation", () => {
      it("should reject missing role", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: "testuser",
              email: "test@example.com",
            }),
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("staff, manager, admin");
      });

      it("should reject invalid roles", async () => {
        const invalidRoles = ["superadmin", "user", "guest", "moderator", ""];

        for (const role of invalidRoles) {
          const request = new NextRequest(
            "http://localhost:3000/api/admin/users",
            {
              method: "POST",
              body: JSON.stringify({
                username: "testuser",
                email: "test@example.com",
                role,
              }),
            }
          );

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toContain("staff, manager, admin");
        }
      });

      it("should accept valid roles", async () => {
        const validRoles = ["staff", "manager", "admin"];

        for (const role of validRoles) {
          const request = new NextRequest(
            "http://localhost:3000/api/admin/users",
            {
              method: "POST",
              body: JSON.stringify({
                username: `user_${role}`,
                email: `${role}@example.com`,
                role,
              }),
            }
          );

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
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: "existinguser",
              email: "different@example.com",
              role: "staff",
            }),
          }
        );

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
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: "differentuser",
              email: "duplicate@example.com",
              role: "staff",
            }),
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain("email already exists");
      });
    });
  });

  describe("📋 Functional Correctness Standards", () => {
    it("should create a new user successfully (setup-email flow)", async () => {
      // Passwords are no longer
      // returned in the response — they're sent as a setup link to the
      // user's email. Test the new contract.
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
      expect(data.message).toContain("Setup email sent");
      expect(data.emailSent).toBe(true);
      // Plaintext password must NOT leak back over the wire.
      expect(data.password).toBeUndefined();
    });

    it("🔒 stores a placeholder hash + setup token on the new user", async () => {
      const { adminUsers } = await getTestCollections();
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "tokenuser",
          email: "token@example.com",
          role: "manager",
        }),
      });
      await POST(request);
      const saved = await adminUsers.findOne({ username: "tokenuser" });
      expect(saved?.passwordHash).toBeDefined();
      // resetToken is stored hashed (sha256 hex = 64 chars) so a DB leak
      // can't be used to hijack the setup link.
      expect(saved?.resetToken).toMatch(/^[a-f0-9]{64}$/);
      expect(saved?.resetTokenExpiry).toBeInstanceOf(Date);
      // ~1h TTL
      const ttl =
        (saved!.resetTokenExpiry as Date).getTime() - Date.now();
      expect(ttl).toBeGreaterThan(50 * 60 * 1000);
      expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000);
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

  describe("🔒 Security Standards - Setup Token Uniqueness", () => {
    // The "generated password" tests were superseded by the setup-email
    // flow — passwords are no longer returned over the wire. We instead
    // assert the new server-stored setup-token contract: unique per user,
    // SHA-256-hashed at rest, never echoed back in the response.
    it("never echoes a plaintext password or raw setup token in the response", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: "noecho",
          email: "noecho@example.com",
          role: "staff",
        }),
      });
      const response = await POST(request);
      const data = await response.json();
      expect(data.password).toBeUndefined();
      expect(data.resetToken).toBeUndefined();
      expect(data.passwordHash).toBeUndefined();
    });

    it("issues a unique setup-token hash per user", async () => {
      const { adminUsers } = await getTestCollections();
      const tokens = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest(
          "http://localhost:3000/api/admin/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: `unique${i}`,
              email: `unique${i}@example.com`,
              role: "staff",
            }),
          }
        );
        await POST(request);
      }
      const saved = await adminUsers
        .find({ username: { $regex: /^unique\d$/ } })
        .toArray();
      for (const u of saved) tokens.add(u.resetToken as string);
      expect(tokens.size).toBe(5);
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
      expect(response.status).toBe(400);
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
