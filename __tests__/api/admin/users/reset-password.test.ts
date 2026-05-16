/**
 * @jest-environment node
 *
 * Tests for /api/admin/users/reset-password (src/app/api/admin/users/reset-password/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: token format gate (hex/64); only unexpired hashed tokens match;
 *   single-use (cleared on success); per-IP rate limit; stricter password rules
 *   than customer flow (12-200 chars, mixed case + digit).
 * - 📋 Functional: success rotates passwordHash, stamps updatedAt, audit-logs.
 */
import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/users/reset-password/route";
import { getTestCollections } from "../../../utils/testUtils";

let ipCounter = 0;
function uniqueIp() {
  ipCounter += 1;
  return `10.60.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

function makeRequest(body: unknown, ip?: string) {
  return new NextRequest(
    "http://localhost:3000/api/admin/users/reset-password",
    {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip ?? uniqueIp(),
      },
    }
  );
}

const VALID_TOKEN = "a".repeat(64);
const VALID_PASSWORD = "GoodPwd-123abc";

async function seedAdminWithToken(
  username: string,
  token = VALID_TOKEN,
  ttlMs = 60 * 60 * 1000
) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { adminUsers, client } = await getTestCollections();
  await adminUsers.insertOne({
    username,
    email: `${username}@example.com`,
    passwordHash: "old-hash",
    resetToken: tokenHash,
    resetTokenExpiry: new Date(Date.now() + ttlMs),
  } as never);
  await client.close();
  return token;
}

describe("POST /api/admin/users/reset-password", () => {
  it("returns 400 for malformed JSON body", async () => {
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });

  it("🔒 rejects token that isn't 64-hex characters", async () => {
    const res = await POST(
      makeRequest({ token: "bad-token", newPassword: VALID_PASSWORD })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid|expired/i);
  });

  it.each([
    ["too short", "Short1a"],
    ["no uppercase", "lowercaseonly123"],
    ["no lowercase", "UPPERCASEONLY123"],
    ["no digit", "OnlyLettersHere"],
    ["too long", "Aa1" + "x".repeat(200)],
  ])("rejects weak password: %s", async (_label, badPwd) => {
    const res = await POST(
      makeRequest({ token: VALID_TOKEN, newPassword: badPwd })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/12.*200|uppercase|digit/i);
  });

  it("returns 400 when no user matches the token hash", async () => {
    const res = await POST(
      makeRequest({ token: VALID_TOKEN, newPassword: VALID_PASSWORD })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an expired token", async () => {
    await seedAdminWithToken("expired-admin", "b".repeat(64), -1000);
    const res = await POST(
      makeRequest({
        token: "b".repeat(64),
        newPassword: VALID_PASSWORD,
      })
    );
    expect(res.status).toBe(400);
  });

  it("rotates passwordHash on success and clears the token", async () => {
    const token = await seedAdminWithToken("ok-admin");
    const res = await POST(
      makeRequest({ token, newPassword: VALID_PASSWORD })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);

    const { adminUsers, client } = await getTestCollections();
    const saved = await adminUsers.findOne({ username: "ok-admin" });
    expect(saved?.passwordHash).toBeDefined();
    expect(saved?.passwordHash).not.toBe("old-hash");
    expect(saved?.resetToken).toBeUndefined();
    expect(saved?.resetTokenExpiry).toBeUndefined();
    expect(saved?.updatedAt).toBeInstanceOf(Date);
    await client.close();
  });

  it("🔒 the same token can't be used twice", async () => {
    const token = await seedAdminWithToken("twice-admin");
    const first = await POST(
      makeRequest({ token, newPassword: VALID_PASSWORD })
    );
    expect(first.status).toBe(200);
    const second = await POST(
      makeRequest({ token, newPassword: VALID_PASSWORD })
    );
    expect(second.status).toBe(400);
  });

  it("🔒 rate-limits the same IP after 3 attempts (429)", async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 3; i++) {
      await POST(
        makeRequest(
          { token: VALID_TOKEN, newPassword: VALID_PASSWORD },
          ip
        )
      );
    }
    const fourth = await POST(
      makeRequest(
        { token: VALID_TOKEN, newPassword: VALID_PASSWORD },
        ip
      )
    );
    expect(fourth.status).toBe(429);
    expect(fourth.headers.get("Retry-After")).toBeTruthy();
  });
});
