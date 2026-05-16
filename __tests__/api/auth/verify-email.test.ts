/**
 * @jest-environment node
 *
 * Tests for /api/auth/verify-email (src/app/api/auth/verify-email/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: tokens must be hex/64; only unexpired hashed tokens match;
 *   single-use (cleared on success); resend POST is rate-limited and
 *   requires an authenticated session
 * - 📋 Functional: success stamps emailVerified; expiry redirects with
 *   ?verified=expired
 */
import crypto from "crypto";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/auth/verify-email/route";
import { hashVerifyToken } from "@/lib/utils/emailVerification";
import { getTestCollections } from "../../utils/testUtils";

const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

const mockSendVerificationEmail = jest.fn();
jest.mock("@/lib/utils/emailVerification", () => {
  const actual = jest.requireActual("@/lib/utils/emailVerification");
  return {
    ...actual,
    sendVerificationEmail: (...args: unknown[]) =>
      mockSendVerificationEmail(...args),
  };
});

let ipCounter = 0;
function uniqueIp() {
  ipCounter += 1;
  return `10.50.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

async function seedUserWithToken(
  email: string,
  token: string,
  ttlMs = 24 * 60 * 60 * 1000
) {
  const { users, client } = await getTestCollections();
  await users.insertOne({
    email,
    name: "Test",
    verifyToken: hashVerifyToken(token),
    verifyTokenExpiry: new Date(Date.now() + ttlMs),
    createdAt: new Date(),
  } as never);
  await client.close();
}

describe("/api/auth/verify-email", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockSendVerificationEmail.mockReset();
    mockSendVerificationEmail.mockResolvedValue(undefined);
  });

  describe("GET (consume the link)", () => {
    it("🔒 redirects with ?verified=expired when the token isn't 64-hex chars", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/verify-email?token=garbage"
      );
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("verified=expired");
    });

    it("🔒 redirects with ?verified=expired when no matching unexpired row", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/auth/verify-email?token=${"a".repeat(64)}`
      );
      const res = await GET(req);
      expect(res.headers.get("location")).toContain("verified=expired");
    });

    it("redirects with ?verified=expired for an expired token", async () => {
      const token = crypto.randomBytes(32).toString("hex");
      await seedUserWithToken("exp@example.com", token, -1000);
      const req = new NextRequest(
        `http://localhost:3000/api/auth/verify-email?token=${token}`
      );
      const res = await GET(req);
      expect(res.headers.get("location")).toContain("verified=expired");
    });

    it("stamps emailVerified and clears the token on success", async () => {
      const token = crypto.randomBytes(32).toString("hex");
      await seedUserWithToken("ok@example.com", token);
      const req = new NextRequest(
        `http://localhost:3000/api/auth/verify-email?token=${token}`
      );
      const res = await GET(req);
      expect(res.headers.get("location")).toContain("verified=1");

      const { users, client } = await getTestCollections();
      const saved = await users.findOne({ email: "ok@example.com" });
      expect(saved?.emailVerified).toBeInstanceOf(Date);
      expect(saved?.verifyToken).toBeUndefined();
      expect(saved?.verifyTokenExpiry).toBeUndefined();
      await client.close();
    });

    it("🔒 the same link can't be re-used (single-use)", async () => {
      const token = crypto.randomBytes(32).toString("hex");
      await seedUserWithToken("twice@example.com", token);
      const req = () =>
        new NextRequest(
          `http://localhost:3000/api/auth/verify-email?token=${token}`
        );
      const first = await GET(req());
      expect(first.headers.get("location")).toContain("verified=1");
      const second = await GET(req());
      expect(second.headers.get("location")).toContain("verified=expired");
    });
  });

  describe("POST (resend the email)", () => {
    function postRequest(ip?: string) {
      return new NextRequest("http://localhost:3000/api/auth/verify-email", {
        method: "POST",
        headers: { "x-forwarded-for": ip ?? uniqueIp() },
      });
    }

    it("🔒 returns 401 when not signed in", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await POST(postRequest());
      expect(res.status).toBe(401);
    });

    it("returns verified=true immediately when emailVerified is already set", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "already@example.com" },
      });
      const { users, client } = await getTestCollections();
      await users.insertOne({
        email: "already@example.com",
        emailVerified: new Date(),
      } as never);
      await client.close();

      const res = await POST(postRequest());
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.verified).toBe(true);
      expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    });

    it("triggers sendVerificationEmail when the email is not yet verified", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "pending@example.com" },
      });
      const { users, client } = await getTestCollections();
      await users.insertOne({ email: "pending@example.com" } as never);
      await client.close();

      const res = await POST(postRequest());
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.verified).toBe(false);
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        "pending@example.com"
      );
    });

    it("🔒 rate-limits the same IP after 3 resends (429)", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "rl@example.com" },
      });
      const ip = uniqueIp();
      for (let i = 0; i < 3; i++) {
        await POST(postRequest(ip));
      }
      const fourth = await POST(postRequest(ip));
      expect(fourth.status).toBe(429);
      expect(fourth.headers.get("Retry-After")).toBeTruthy();
    });
  });
});
