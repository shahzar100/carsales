/**
 * @jest-environment node
 *
 * Tests for /api/auth/reset-password (src/app/api/auth/reset-password/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: token format gate; only unexpired hashed tokens match;
 *   single-use (cleared on success); per-IP rate limit; 8-char password min.
 * - 📋 Functional: a valid token rotates the password and stamps updatedAt.
 */
import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/reset-password/route";
import { getTestCollections } from "../../utils/testUtils";

let ipCounter = 0;
function uniqueIp() {
  ipCounter += 1;
  return `10.40.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

function makeRequest(body: unknown, ip?: string) {
  return new NextRequest("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip ?? uniqueIp(),
    },
  });
}

const VALID_TOKEN = "a".repeat(64);
const INVALID_TOKEN = "not-hex";

async function seedUserWithToken(
  email: string,
  token = VALID_TOKEN,
  ttlMs = 60 * 60 * 1000
) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { users, client } = await getTestCollections();
  await users.insertOne({
    email,
    password: "old-hash",
    resetToken: tokenHash,
    resetTokenExpiry: new Date(Date.now() + ttlMs),
    createdAt: new Date(),
  } as never);
  await client.close();
  return token;
}

describe("POST /api/auth/reset-password", () => {
  it("returns 400 for malformed JSON body", async () => {
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });

  it("🔒 rejects token that isn't 64-hex characters at the schema gate", async () => {
    const res = await POST(
      makeRequest({ token: INVALID_TOKEN, newPassword: "longenough" })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid|expired/i);
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const res = await POST(
      makeRequest({ token: VALID_TOKEN, newPassword: "short" })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/at least 8/i);
  });

  it("returns 400 when no user matches the token hash", async () => {
    const res = await POST(
      makeRequest({ token: VALID_TOKEN, newPassword: "long-enough-pw" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an expired token", async () => {
    await seedUserWithToken("expired@example.com", "b".repeat(64), -1000);
    const res = await POST(
      makeRequest({ token: "b".repeat(64), newPassword: "long-enough-pw" })
    );
    expect(res.status).toBe(400);
  });

  it("rotates the password hash on success and clears the token", async () => {
    const token = await seedUserWithToken("ok@example.com");
    const res = await POST(
      makeRequest({ token, newPassword: "long-enough-pw" })
    );
    expect(res.status).toBe(200);

    const { users, client } = await getTestCollections();
    const after = await users.findOne({ email: "ok@example.com" });
    expect(after?.password).toBeDefined();
    expect(after?.password).not.toBe("old-hash");
    expect(after?.resetToken).toBeUndefined();
    expect(after?.resetTokenExpiry).toBeUndefined();
    expect(after?.updatedAt).toBeInstanceOf(Date);
    await client.close();
  });

  it("🔒 the same token can't be used twice (single-use guarantee)", async () => {
    const token = await seedUserWithToken("twice@example.com");
    const first = await POST(
      makeRequest({ token, newPassword: "first-new-pw" })
    );
    expect(first.status).toBe(200);
    const second = await POST(
      makeRequest({ token, newPassword: "second-new-pw" })
    );
    expect(second.status).toBe(400);
  });

  it("🔒 rate-limits the same IP after 5 attempts (429)", async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) {
      await POST(
        makeRequest(
          { token: VALID_TOKEN, newPassword: "long-enough-pw" },
          ip
        )
      );
    }
    const sixth = await POST(
      makeRequest(
        { token: VALID_TOKEN, newPassword: "long-enough-pw" },
        ip
      )
    );
    expect(sixth.status).toBe(429);
  });
});
