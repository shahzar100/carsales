/**
 * @jest-environment node
 *
 * Tests for /api/account/password (src/app/api/account/password/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: current-password gate when one exists; rate limiting; only
 *   the signed-in user's own password is rotated
 * - 📋 Functional: first-time set when account has no password; 8-char min
 * - 🎯 Usability: clear 400 messages for each validation failure
 */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { POST } from "@/app/api/account/password/route";
import { getTestCollections } from "../../utils/testUtils";

const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

async function seedUser(email: string, password?: string) {
  const { users, client } = await getTestCollections();
  await users.insertOne({
    email,
    name: "Test",
    password: password ? await bcrypt.hash(password, 4) : undefined,
    createdAt: new Date(),
  } as never);
  await client.close();
}

let ipCounter = 0;
function uniqueIp(): string {
  ipCounter += 1;
  return `10.20.${(ipCounter >> 8) & 0xff}.${ipCounter & 0xff}`;
}

function makeRequest(body: unknown, ip?: string) {
  return new NextRequest("http://localhost:3000/api/account/password", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip ?? uniqueIp(),
    },
  });
}

describe("/api/account/password POST", () => {
  beforeEach(() => mockAuth.mockReset());

  it("🔒 returns 401 when not signed in", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(
      makeRequest({ newPassword: "longenoughpw" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for malformed JSON body", async () => {
    mockAuth.mockResolvedValue({ user: { email: "a@b.com" } });
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });

  it("rejects new passwords shorter than 8 characters", async () => {
    mockAuth.mockResolvedValue({ user: { email: "a@b.com" } });
    await seedUser("a@b.com", "oldpass123");
    const res = await POST(
      makeRequest({ currentPassword: "oldpass123", newPassword: "short" })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/at least 8/i);
  });

  it("returns 404 when the account document doesn't exist", async () => {
    mockAuth.mockResolvedValue({ user: { email: "ghost@example.com" } });
    const res = await POST(makeRequest({ newPassword: "longenoughpw" }));
    expect(res.status).toBe(404);
  });

  it("first-time set: succeeds without currentPassword when account has none", async () => {
    mockAuth.mockResolvedValue({ user: { email: "new@example.com" } });
    await seedUser("new@example.com"); // no password yet
    const res = await POST(
      makeRequest({ newPassword: "brand-new-pwd" })
    );
    expect(res.status).toBe(200);

    const { users, client } = await getTestCollections();
    const saved = await users.findOne({ email: "new@example.com" });
    expect(saved?.password).toBeDefined();
    await client.close();
  });

  it("🔒 requires currentPassword when one is already set", async () => {
    mockAuth.mockResolvedValue({ user: { email: "x@example.com" } });
    await seedUser("x@example.com", "oldpassword");
    const res = await POST(makeRequest({ newPassword: "new-pwd-here" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/current password is required/i);
  });

  it("🔒 rejects wrong currentPassword", async () => {
    mockAuth.mockResolvedValue({ user: { email: "y@example.com" } });
    await seedUser("y@example.com", "actualOldPwd");
    const res = await POST(
      makeRequest({
        currentPassword: "wrong-guess",
        newPassword: "new-pwd-here",
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/incorrect/i);
  });

  it("rotates the password hash when currentPassword matches", async () => {
    mockAuth.mockResolvedValue({ user: { email: "z@example.com" } });
    await seedUser("z@example.com", "actualOldPwd");

    const { users, client } = await getTestCollections();
    const before = await users.findOne({ email: "z@example.com" });
    await client.close();

    const res = await POST(
      makeRequest({
        currentPassword: "actualOldPwd",
        newPassword: "fresh-new-pwd",
      })
    );
    expect(res.status).toBe(200);

    const { users: u2, client: c2 } = await getTestCollections();
    const after = await u2.findOne({ email: "z@example.com" });
    expect(after?.password).toBeDefined();
    expect(after?.password).not.toBe(before?.password);
    await c2.close();
  });

  it("🔒 rate-limits the same IP after 5 attempts (429)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "rl@example.com" } });
    await seedUser("rl@example.com", "anything");
    const ip = uniqueIp();

    // 5 attempts to fill the bucket — any status counts toward the limit
    // because the limiter runs before validation, not after.
    for (let i = 0; i < 5; i++) {
      await POST(
        makeRequest(
          { currentPassword: "wrong", newPassword: "long-enough-pw" },
          ip
        )
      );
    }
    const sixth = await POST(
      makeRequest(
        { currentPassword: "wrong", newPassword: "long-enough-pw" },
        ip
      )
    );
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get("Retry-After")).toBeTruthy();
  });
});
