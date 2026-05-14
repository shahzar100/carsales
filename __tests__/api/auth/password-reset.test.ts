/**
 * @jest-environment node
 *
 * Tests for the customer password-reset pair:
 *   - POST /api/auth/forgot-password  (mints + emails a reset token)
 *   - POST /api/auth/reset-password   (consumes the token)
 */
import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";
import { getTestCollections } from "../../utils/testUtils";

jest.mock("@/emails/send", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

const sha256 = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");

function req(path: string, body: unknown, ip: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
  });
}

async function seedUser(email: string, extra: Record<string, unknown> = {}) {
  const { users, client } = await getTestCollections();
  await users.insertOne({
    name: "Test User",
    email,
    password: "$2b$12$abcdefghijklmnopqrstuv", // placeholder hash
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  });
  await client.close();
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  it("stores a hashed reset token for a registered email", async () => {
    await seedUser("known@example.com");

    const res = await forgotPassword(
      req("/api/auth/forgot-password", { email: "known@example.com" }, "10.2.0.1")
    );
    expect(res.status).toBe(200);

    const { users, client } = await getTestCollections();
    const user = await users.findOne({ email: "known@example.com" });
    // Only the hash is stored — never the plaintext token.
    expect(user?.resetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user?.resetTokenExpiry).toBeInstanceOf(Date);
    expect((user?.resetTokenExpiry as Date).getTime()).toBeGreaterThan(
      Date.now()
    );
    await client.close();
  });

  it("returns a generic success for an unknown email (no enumeration)", async () => {
    const res = await forgotPassword(
      req(
        "/api/auth/forgot-password",
        { email: "nobody@example.com" },
        "10.2.0.2"
      )
    );
    const data = await res.json();
    // Same 200 + message as the registered case.
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("rejects a malformed JSON body", async () => {
    const res = await forgotPassword(
      req("/api/auth/forgot-password", "{ bad", "10.2.0.3")
    );
    expect(res.status).toBe(400);
  });

  it("rate-limits repeated requests from one IP", async () => {
    for (let i = 0; i < 3; i++) {
      await forgotPassword(
        req("/api/auth/forgot-password", { email: "x@example.com" }, "10.2.9.9")
      );
    }
    const res = await forgotPassword(
      req("/api/auth/forgot-password", { email: "x@example.com" }, "10.2.9.9")
    );
    expect(res.status).toBe(429);
  });
});

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  it("sets a new password and clears the token for a valid link", async () => {
    const token = "a".repeat(64);
    await seedUser("reset@example.com", {
      resetToken: sha256(token),
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await resetPassword(
      req(
        "/api/auth/reset-password",
        { token, newPassword: "brand-new-pw" },
        "10.3.0.1"
      )
    );
    expect(res.status).toBe(200);

    const { users, client } = await getTestCollections();
    const user = await users.findOne({ email: "reset@example.com" });
    expect(user?.password).toMatch(/^\$2[aby]\$/);
    expect(user?.password).not.toBe("$2b$12$abcdefghijklmnopqrstuv");
    // Token is consumed so the link can't be replayed.
    expect(user?.resetToken).toBeUndefined();
    expect(user?.resetTokenExpiry).toBeUndefined();
    await client.close();
  });

  it("rejects a token that doesn't match any user", async () => {
    const res = await resetPassword(
      req(
        "/api/auth/reset-password",
        { token: "b".repeat(64), newPassword: "brand-new-pw" },
        "10.3.0.2"
      )
    );
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/invalid or has expired/i);
  });

  it("rejects an expired token", async () => {
    const token = "c".repeat(64);
    await seedUser("expired@example.com", {
      resetToken: sha256(token),
      resetTokenExpiry: new Date(Date.now() - 1000),
    });

    const res = await resetPassword(
      req(
        "/api/auth/reset-password",
        { token, newPassword: "brand-new-pw" },
        "10.3.0.3"
      )
    );
    expect(res.status).toBe(400);
  });

  it("rejects a badly-shaped token", async () => {
    const res = await resetPassword(
      req(
        "/api/auth/reset-password",
        { token: "too-short", newPassword: "brand-new-pw" },
        "10.3.0.4"
      )
    );
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await resetPassword(
      req(
        "/api/auth/reset-password",
        { token: "d".repeat(64), newPassword: "short" },
        "10.3.0.5"
      )
    );
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/8 characters/i);
  });
});
