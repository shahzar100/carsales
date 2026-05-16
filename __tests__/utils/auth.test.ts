/**
 * @jest-environment node
 *
 * Tests for authentication utilities (src/lib/utils/auth.ts)
 *
 * Standards coverage:
 * - 🔒 Security: Password hashing, verification, session validation
 * - 📋 Functional: Authentication flow correctness
 */
import bcrypt from "bcryptjs";
import {
  hashPassword,
  verifyPassword,
  isAuthenticated,
  getSession,
} from "@/lib/utils/auth";

// Mock iron-session
const mockSession: {
  isLoggedIn: any;
  username: any;
  save: jest.Mock;
  destroy: jest.Mock;
} = {
  isLoggedIn: false,
  username: undefined,
  save: jest.fn(),
  destroy: jest.fn(),
};

jest.mock("iron-session", () => ({
  getIronSession: jest.fn(() => Promise.resolve(mockSession)),
  SessionOptions: {},
  IronSession: {},
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => Promise.resolve({})),
}));

describe("Authentication Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.isLoggedIn = false;
    mockSession.username = undefined;
  });

  describe("\ud83d\udd12 Security Standards - Password Hashing", () => {
    describe("hashPassword", () => {
      it("should hash a password securely", async () => {
        const password = "SecurePassword123!";
        const hash = await hashPassword(password);

        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
        expect(hash.startsWith("$2")).toBe(true); // bcrypt hash prefix
      });

      it("should generate different hashes for the same password", async () => {
        const password = "TestPassword123";
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1).not.toBe(hash2); // Salt makes each hash unique
        expect(hash1.length).toBe(hash2.length);
      });

      it("should handle empty password", async () => {
        const hash = await hashPassword("");
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(50);
      });

      it("should handle long passwords", async () => {
        const longPassword = "a".repeat(1000);
        const hash = await hashPassword(longPassword);
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(50);
      });

      it("should handle special characters in passwords", async () => {
        const specialPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";
        const hash = await hashPassword(specialPassword);
        expect(hash).toBeDefined();
        expect(await bcrypt.compare(specialPassword, hash)).toBe(true);
      });

      it("should handle unicode characters", async () => {
        const unicodePassword = "\u30d1\u30b9\u30ef\u30fc\u30c9123\u5bc6\u7801\ud83d\udd12";
        const hash = await hashPassword(unicodePassword);
        expect(hash).toBeDefined();
        expect(await bcrypt.compare(unicodePassword, hash)).toBe(true);
      });
    });

    describe("verifyPassword", () => {
      it("should verify a correct password", async () => {
        const password = "CorrectPassword123";
        const hash = await hashPassword(password);

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
      });

      it("should reject an incorrect password", async () => {
        const correctPassword = "CorrectPassword123";
        const wrongPassword = "WrongPassword456";
        const hash = await hashPassword(correctPassword);

        const isValid = await verifyPassword(wrongPassword, hash);
        expect(isValid).toBe(false);
      });

      it("should reject empty password against valid hash", async () => {
        const password = "ValidPassword123";
        const hash = await hashPassword(password);

        const isValid = await verifyPassword("", hash);
        expect(isValid).toBe(false);
      });

      it("should handle case-sensitive verification", async () => {
        const password = "Password123";
        const hash = await hashPassword(password);

        expect(await verifyPassword("password123", hash)).toBe(false);
        expect(await verifyPassword("PASSWORD123", hash)).toBe(false);
        expect(await verifyPassword(password, hash)).toBe(true);
      });

      it("should reject password with leading/trailing whitespace", async () => {
        const password = "TrimmedPassword";
        const hash = await hashPassword(password);

        expect(await verifyPassword(" TrimmedPassword", hash)).toBe(false);
        expect(await verifyPassword("TrimmedPassword ", hash)).toBe(false);
        expect(await verifyPassword(" TrimmedPassword ", hash)).toBe(false);
      });

      it("should handle verification with invalid hash format", async () => {
        const password = "TestPassword";
        const invalidHash = "not-a-valid-bcrypt-hash";

        const result = await verifyPassword(password, invalidHash);
        expect(result).toBe(false);
      });
    });
  });

  describe("\ud83d\udd12 Security Standards - Session Management", () => {
    describe("getSession", () => {
      const originalEnv = process.env.NODE_ENV;

      afterEach(() => {
        // Use direct assignment with type cast to ensure process.env is properly restored
        (process.env as Record<string, string | undefined>).NODE_ENV =
          originalEnv;
        delete process.env.SESSION_SECRET;
        jest.resetModules();
      });

      it("should return a session object", async () => {
        const session = await getSession();

        expect(session).toBeDefined();
        expect(session).toHaveProperty("isLoggedIn");
      });

      it("should have secure session options in production", () => {
        process.env.SESSION_SECRET =
          "a_test_secret_that_is_at_least_32_chars_long!!";
        // Production also requires AUTH_SECRET — Auth.js uses it for the
        // customer-session JWTs (added to env.ts after customer auth landed).
        process.env.AUTH_SECRET =
          process.env.AUTH_SECRET ||
          "a_test_auth_secret_that_is_at_least_32_chars_long!!";
        (process.env as Record<string, string | undefined>).NODE_ENV =
          "production";

        jest.resetModules();
        const { sessionOptions } = require("@/lib/utils/auth");

        expect(sessionOptions.cookieOptions.secure).toBe(true);
        expect(sessionOptions.cookieOptions.httpOnly).toBe(true);
      });

      it("should allow insecure cookies in development", () => {
        (process.env as Record<string, string | undefined>).NODE_ENV =
          "development";

        jest.resetModules();
        const { sessionOptions } = require("@/lib/utils/auth");

        expect(sessionOptions.cookieOptions.secure).toBe(false);
        expect(sessionOptions.cookieOptions.httpOnly).toBe(true);
      });

      it("should have httpOnly flag always enabled", () => {
        // Set SESSION_SECRET defensively in case NODE_ENV is still "production"
        process.env.SESSION_SECRET =
          "a_test_secret_that_is_at_least_32_chars_long!!";
        const { sessionOptions } = require("@/lib/utils/auth");
        expect(sessionOptions.cookieOptions.httpOnly).toBe(true);
      });
    });

    describe("isAuthenticated", () => {
      it("should return true when user is logged in", async () => {
        mockSession.isLoggedIn = true;
        mockSession.username = "admin";

        const result = await isAuthenticated();
        expect(result).toBe(true);
      });

      it("should return false when user is not logged in", async () => {
        mockSession.isLoggedIn = false;

        const result = await isAuthenticated();
        expect(result).toBe(false);
      });

      it("should return false when isLoggedIn is undefined", async () => {
        mockSession.isLoggedIn = undefined as any;

        const result = await isAuthenticated();
        expect(result).toBe(false);
      });

      it("should return false when isLoggedIn is null", async () => {
        mockSession.isLoggedIn = null as any;

        const result = await isAuthenticated();
        expect(result).toBe(false);
      });

      it("should strictly check for true boolean value", async () => {
        // Test truthy but not true
        mockSession.isLoggedIn = 1 as any;
        expect(await isAuthenticated()).toBe(false);

        mockSession.isLoggedIn = "true" as any;
        expect(await isAuthenticated()).toBe(false);

        mockSession.isLoggedIn = {} as any;
        expect(await isAuthenticated()).toBe(false);
      });
    });
  });

  describe("\ud83d\udccb Functional Correctness Standards", () => {
    it("should complete full password hash and verify cycle", async () => {
      const originalPassword = "MySecurePassword123!";

      // Hash the password
      const hashedPassword = await hashPassword(originalPassword);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(originalPassword);

      // Verify correct password
      const isCorrect = await verifyPassword(originalPassword, hashedPassword);
      expect(isCorrect).toBe(true);

      // Verify incorrect password
      const isIncorrect = await verifyPassword("WrongPassword", hashedPassword);
      expect(isIncorrect).toBe(false);
    });

    it("should handle authentication state transitions", async () => {
      // Initially not authenticated
      mockSession.isLoggedIn = false;
      expect(await isAuthenticated()).toBe(false);

      // After login
      mockSession.isLoggedIn = true;
      mockSession.username = "testuser";
      expect(await isAuthenticated()).toBe(true);

      // After logout
      mockSession.isLoggedIn = false;
      mockSession.username = undefined;
      expect(await isAuthenticated()).toBe(false);
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("should handle null password in hashPassword", async () => {
      await expect(hashPassword(null as any)).rejects.toThrow();
    });

    it("should handle undefined password in hashPassword", async () => {
      await expect(hashPassword(undefined as any)).rejects.toThrow();
    });

    it("should handle null values in verifyPassword", async () => {
      const hash = await hashPassword("test");
      await expect(verifyPassword(null as any, hash)).rejects.toThrow();
      await expect(verifyPassword("test", null as any)).rejects.toThrow();
    });

    it("should handle empty string hash in verifyPassword", async () => {
      const result = await verifyPassword("password", "");
      expect(result).toBe(false);
    });
  });

  describe("Module-level production guard", () => {
    it("should throw when SESSION_SECRET is missing in production", () => {
      // The throw now originates in src/lib/env.ts (validateServerEnv),
      // which auth.ts imports. Behaviour is preserved: importing auth in
      // production without SESSION_SECRET aborts module load.
      const originalNodeEnv = process.env.NODE_ENV;
      const originalSessionSecret = process.env.SESSION_SECRET;

      delete process.env.SESSION_SECRET;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
        configurable: true,
      });

      expect(() => {
        jest.isolateModules(() => {
          require("@/lib/utils/auth");
        });
      }).toThrow(/SESSION_SECRET must be set in production/);

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      });
      process.env.SESSION_SECRET = originalSessionSecret;
    });
  });
});
