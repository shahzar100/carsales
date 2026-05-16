/**
 * @jest-environment node
 *
 * Tests for /api/admin/users/password route (src/app/api/admin/users/password/route.ts)
 *
 * Standards coverage:
 * - 📋 Functional: Password reset, password reminder
 * - 🔒 Security: Input validation, proper error responses
 * - 🎯 Usability: Meaningful error messages
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/users/password/route";
import { getTestCollections, flushWaitUntil } from "../../../utils/testUtils";
import bcrypt from "bcryptjs";

// Mock authentication and password hashing
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hashPassword: jest.fn((pwd: string) => {
    const bcrypt = require("bcryptjs");
    return bcrypt.hash(pwd, 10);
  }),
  // The route audit-logs each password change via getSession().username,
  // and gates "admin can reset another admin's password" through hasMinimumRole.
  getSession: jest.fn(async () => ({ username: "test-admin" })),
  hasMinimumRole: jest.fn(async () => true),
}));
const { isAuthenticated: mockIsAuthenticated } = require("@/lib/utils/auth");

// Mock email sending
jest.mock("@/emails/send", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));
const { sendEmail: mockSendEmail } = require("@/emails/send");

// Mock PasswordReset email component
jest.mock("@/emails/PasswordReset", () => ({
  PasswordReset: () => null,
}));

describe("/api/admin/users/password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockResolvedValue(true); // Default to authenticated
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("POST - Reset Password", () => {
    // Reset flow no longer rotates the password directly — it emails a
    // time-limited reset link and only updates the password once the user
    // submits a new one through that link. Asserting that change here.

    it("issues a hashed reset token and emails the user", async () => {
      const { adminUsers, client } = await getTestCollections();
      const oldHash = await bcrypt.hash("old-password", 10);
      await adminUsers.insertOne({
        username: "testuser",
        email: "test@example.com",
        passwordHash: oldHash,
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({ action: "reset", username: "testuser" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailSent).toBe(true);
      expect(data.message).toMatch(/reset/i);
      // Plaintext password must NOT come back in the response.
      expect(data.password).toBeUndefined();

      const { adminUsers: u2, client: c2 } = await getTestCollections();
      const saved = await u2.findOne({ username: "testuser" });
      expect(saved?.resetToken).toMatch(/^[a-f0-9]{64}$/); // sha-256 hex
      expect(saved?.resetTokenExpiry).toBeInstanceOf(Date);
      // password hash is left alone until the user completes the flow
      expect(saved?.passwordHash).toBe(oldHash);
      await c2.close();
    });

    it("stamps the user's updatedAt on reset-token issue", async () => {
      const { adminUsers, client } = await getTestCollections();
      await adminUsers.insertOne({
        username: "testuser2",
        email: "test2@example.com",
        passwordHash: await bcrypt.hash("old-password", 10),
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({ action: "reset", username: "testuser2" }),
        }
      );
      await POST(request);

      const { adminUsers: u2, client: c2 } = await getTestCollections();
      const updated = await u2.findOne({ username: "testuser2" });
      expect(updated?.updatedAt).toBeInstanceOf(Date);
      await c2.close();
    });
  });

  describe("POST - Password Reminder", () => {
    it("should send password reminder email", async () => {
      const { adminUsers, client } = await getTestCollections();
      await adminUsers.insertOne({
        username: "emailuser",
        email: "user@example.com",
        passwordHash: "hashed",
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({
            action: "reminder",
            username: "emailuser",
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailSent).toBe(true);

      // Flush background email send (waitUntil)
      await flushWaitUntil();

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringContaining("Password Reset"),
        })
      );
    });

    it("should return 400 when user has no email", async () => {
      const { adminUsers, client } = await getTestCollections();
      await adminUsers.insertOne({
        username: "noemailuser",
        passwordHash: "hashed",
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({
            action: "reminder",
            username: "noemailuser",
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("no email");
    });

    it("should succeed even when email fails (fire-and-forget via waitUntil)", async () => {
      mockSendEmail.mockResolvedValueOnce({ success: false });

      const { adminUsers, client } = await getTestCollections();
      await adminUsers.insertOne({
        username: "failemailuser",
        email: "fail@example.com",
        passwordHash: "hashed",
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({
            action: "reminder",
            username: "failemailuser",
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // With waitUntil, the response succeeds even if the email fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailSent).toBe(true);
    });

    it("should store reset token in database", async () => {
      const { adminUsers, client } = await getTestCollections();
      await adminUsers.insertOne({
        username: "tokenuser",
        email: "token@example.com",
        passwordHash: "hashed",
      });
      await client.close();

      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({
            action: "reminder",
            username: "tokenuser",
          }),
        }
      );

      await POST(request);

      const { adminUsers: users2, client: client2 } =
        await getTestCollections();
      const user = await users2.findOne({ username: "tokenuser" });
      expect(user?.resetToken).toBeDefined();
      expect(user?.resetTokenExpiry).toBeDefined();
      await client2.close();
    });
  });

  describe("Validation", () => {
    it("should return 400 for invalid action", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({
            action: "invalid",
            username: "testuser",
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("reset");
    });

    it("should return 400 when action is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({ username: "testuser" }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when username is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({ action: "reset" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Username");
    });

    it("should return 404 when user not found", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/users/password",
        {
          method: "POST",
          body: JSON.stringify({
            action: "reset",
            username: "nonexistent",
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });
});
