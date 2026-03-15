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
  });

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  describe("POST - Reset Password", () => {
    it("should reset password and return new password", async () => {
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
      expect(data.password).toBeDefined();
      expect(data.password).toMatch(/^.{4}-.{4}-.{4}-.{4}$/); // format: XXXX-XXXX-XXXX-XXXX
      expect(data.message).toContain("reset");
    });

    it("should update the password hash in the database", async () => {
      const { adminUsers, client } = await getTestCollections();
      const oldHash = await bcrypt.hash("old-password", 10);
      await adminUsers.insertOne({
        username: "testuser2",
        email: "test2@example.com",
        passwordHash: oldHash,
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

      // Verify the hash was changed
      const { adminUsers: users2, client: client2 } =
        await getTestCollections();
      const updatedUser = await users2.findOne({ username: "testuser2" });
      expect(updatedUser?.passwordHash).not.toBe(oldHash);
      expect(updatedUser?.updatedAt).toBeDefined();
      await client2.close();
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
      const data = await response.json();

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
