/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/login/route";
import { getTestCollections, createTestAdminUser } from "../../utils/testUtils";

// Mock getSession (iron-session requires cookies which aren't available in node tests)
// Keep verifyPassword real so we test actual password hashing
const mockSession = { isLoggedIn: false, username: undefined as string | undefined, save: jest.fn() };
jest.mock("@/lib/utils/auth", () => {
  const actual = jest.requireActual("@/lib/utils/auth");
  return {
    ...actual,
    getSession: jest.fn().mockImplementation(() => Promise.resolve(mockSession)),
  };
});

// The login route uses an in-memory rate limiter when KV is not configured.
// Tests need a unique IP per request OR a reset before each `it()` — the
// 6th attempt from "unknown" would otherwise return 429 instead of the
// expected status.
let ipCounter = 0;
function uniqueIp(): string {
  ipCounter += 1;
  return `10.${(ipCounter >> 16) & 0xff}.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

describe("/api/admin/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.isLoggedIn = false;
    mockSession.username = undefined;
  });

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
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": uniqueIp(),
        },
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
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": uniqueIp(),
        },
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
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": uniqueIp(),
        },
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
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": uniqueIp(),
        },
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
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": uniqueIp(),
        },
      });

      await POST(request);

      // Verify lastLogin was updated
      const { adminUsers, client } = await getTestCollections();
      const updatedUser = await adminUsers.findOne({ username: "testadmin" });
      expect(updatedUser?.lastLogin).toBeDefined();
      await client.close();
    });

    it("should return 400 with a clear message when the body isn't valid JSON", async () => {
      // The route now catches JSON parse errors explicitly and returns 400,
      // rather than letting them bubble to the catch-all 500 handler — a
      // malformed body is a client mistake, not a server fault.
      const request = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: "not valid json",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": uniqueIp(),
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid JSON body");
    });

    it("🔒 returns 429 when the same IP exceeds the 5-attempt window", async () => {
      const ip = uniqueIp();
      // Five failed-credential attempts to consume the window.
      for (let i = 0; i < 5; i++) {
        const r = new NextRequest("http://localhost:3000/api/admin/login", {
          method: "POST",
          body: JSON.stringify({ username: "x", password: "y" }),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": ip,
          },
        });
        await POST(r);
      }
      const sixth = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: "x", password: "y" }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
      });
      const res = await POST(sixth);
      const data = await res.json();
      expect(res.status).toBe(429);
      expect(data.error).toMatch(/too many login attempts/i);
      expect(res.headers.get("Retry-After")).toBeTruthy();
    });
  });
});
