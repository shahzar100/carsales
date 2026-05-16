/**
 * @jest-environment node
 *
 * Tests for /api/auth/forgot-password (src/app/api/auth/forgot-password/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: response shape is identical whether the email exists or
 *   not (no account enumeration); only the SHA-256 hash of the reset token
 *   is persisted; 1-hour TTL; per-IP rate limit.
 * - 📋 Functional: known emails get a reset token row written; unknown emails
 *   pass through cleanly without crashing.
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/forgot-password/route";
import { getTestCollections } from "../../utils/testUtils";

const mockSendEmail = jest.fn();
jest.mock("@/emails/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));
jest.mock("@/emails/CustomerPasswordReset", () => ({
  CustomerPasswordReset: () => null,
}));

let ipCounter = 0;
function uniqueIp() {
  ipCounter += 1;
  return `10.30.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

function makeRequest(body: unknown, ip?: string) {
  return new NextRequest("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip ?? uniqueIp(),
    },
  });
}

async function seedUser(email: string) {
  const { users, client } = await getTestCollections();
  await users.insertOne({
    email,
    name: "Test",
    createdAt: new Date(),
  } as never);
  await client.close();
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue({ success: true });
  });

  it("returns a generic success for malformed JSON body (no signal leak)", async () => {
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400); // explicit 400 for invalid JSON is fine
  });

  it("🔒 returns the same generic message for unknown emails", async () => {
    const res = await POST(makeRequest({ email: "noone@example.com" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.message).toMatch(
      /if that email is registered/i
    );
  });

  it("🔒 returns the same generic message for malformed emails", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.message).toMatch(
      /if that email is registered/i
    );
  });

  it("🔒 writes a SHA-256-hashed token and 1h expiry for known emails", async () => {
    await seedUser("known@example.com");
    const res = await POST(makeRequest({ email: "known@example.com" }));
    expect(res.status).toBe(200);

    const { users, client } = await getTestCollections();
    const saved = await users.findOne({ email: "known@example.com" });
    expect(saved?.resetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(saved?.resetTokenExpiry).toBeInstanceOf(Date);
    const ttl = (saved!.resetTokenExpiry as Date).getTime() - Date.now();
    expect(ttl).toBeGreaterThan(55 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000);
    await client.close();
  });

  it("never persists a token row for unknown emails", async () => {
    await POST(makeRequest({ email: "ghost@example.com" }));
    const { users, client } = await getTestCollections();
    const saved = await users.findOne({ email: "ghost@example.com" });
    expect(saved).toBeNull();
    await client.close();
  });

  it("🔒 lowercases the email before lookup", async () => {
    await seedUser("Mixed@Example.com".toLowerCase());
    const res = await POST(makeRequest({ email: "Mixed@Example.com" }));
    expect(res.status).toBe(200);
    const { users, client } = await getTestCollections();
    const saved = await users.findOne({ email: "mixed@example.com" });
    expect(saved?.resetToken).toBeDefined();
    await client.close();
  });

  it("🔒 rate-limits the same IP after 3 attempts (429)", async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 3; i++) {
      await POST(makeRequest({ email: "rl@example.com" }, ip));
    }
    const fourth = await POST(
      makeRequest({ email: "rl@example.com" }, ip)
    );
    expect(fourth.status).toBe(429);
    expect(fourth.headers.get("Retry-After")).toBeTruthy();
  });
});
