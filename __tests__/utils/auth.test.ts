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
import { hashPassword, verifyPassword, isAuthenticated, getSession } from "@/lib/utils/auth";

// Mock iron-session
const mockSession = {
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

  describe("🔒 Security Standards - Password Hashing", () => {
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
        const unicodePassword = "パスワード123密码🔒";
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
        
        await expect(verifyPassword(password, invalidHash)).rejects.toThrow();
      });
    });
  });

  describe("🔒 Security Standards - Session Management", () => {
    describe("getSession", () => {
      it("should return a session object", async () => {
        const session = await getSession();
        
        expect(session).toBeDefined();
        expect(session).toHaveProperty("isLoggedIn");
      });

      it("should have secure session options in production", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        
        // Import sessionOptions dynamically to get production config
        const { sessionOptions } = require("@/lib/utils/auth");
        
        expect(sessionOptions.cookieOptions.secure).toBe(true);
        expect(sessionOptions.cookieOptions.httpOnly).toBe(true);
        
        process.env.NODE_ENV = originalEnv;
      });

      it("should allow insecure cookies in development", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";
        
        jest.resetModules();
        const { sessionOptions } = require("@/lib/utils/auth");
        
        expect(sessionOptions.cookieOptions.secure).toBe(false);
        expect(sessionOptions.cookieOptions.httpOnly).toBe(true);
        
        process.env.NODE_ENV = originalEnv;
        jest.resetModules();
      });

      it("should have httpOnly flag always enabled", () => {
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

  describe("📋 Functional Correctness Standards", () => {
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
      await expect(verifyPassword("password", "")).rejects.toThrow();
    });
  });
});
