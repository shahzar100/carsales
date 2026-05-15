/**
 * @jest-environment node
 *
 * Tests for /api/auth/register (src/app/api/auth/register/route.ts) —
 * customer email/password sign-up.
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";
import { getTestCollections } from "../../utils/testUtils";

// The route fires a verification email via waitUntil → sendVerificationEmail.
// waitUntil is a no-op in tests and sendEmail is mocked, so this never
// actually sends — we just keep the import chain happy.
jest.mock("@/emails/send", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

function makeRequest(body: unknown, ip = "10.1.0.1") {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
  });
}

const validBody = {
  name: "Jane Smith",
  email: "jane@example.com",
  password: "supersecret",
};

describe("/api/auth/register", () => {
  beforeEach(() => jest.clearAllMocks());

  afterEach(async () => {
    const { client } = await getTestCollections();
    await client.close();
  });

  it("creates an account with a hashed password", async () => {
    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);

    const { users, client } = await getTestCollections();
    const user = await users.findOne({ email: "jane@example.com" });
    expect(user).toBeTruthy();
    expect(user?.name).toBe("Jane Smith");
    // Password is stored as a bcrypt hash, never plaintext.
    expect(user?.password).toBeTruthy();
    expect(user?.password).not.toBe("supersecret");
    expect(user?.password).toMatch(/^\$2[aby]\$/);
    expect(user?.emailVerified).toBeNull();
    await client.close();
  });

  it("normalises the email to lowercase", async () => {
    const response = await POST(
      makeRequest({ ...validBody, email: "Jane@Example.COM" }, "10.1.0.2")
    );
    expect(response.status).toBe(201);

    const { users, client } = await getTestCollections();
    expect(await users.findOne({ email: "jane@example.com" })).toBeTruthy();
    await client.close();
  });

  it("rejects a duplicate email", async () => {
    await POST(makeRequest(validBody, "10.1.0.3"));
    const response = await POST(
      makeRequest({ ...validBody, name: "Someone Else" }, "10.1.0.4")
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/already exists/i);
  });

  it("rejects an invalid email", async () => {
    const response = await POST(
      makeRequest({ ...validBody, email: "not-an-email" }, "10.1.0.5")
    );
    expect(response.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const response = await POST(
      makeRequest({ ...validBody, password: "short" }, "10.1.0.6")
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/8 characters/i);
  });

  it("rejects a malformed JSON body", async () => {
    const response = await POST(makeRequest("{ not json", "10.1.0.7"));
    expect(response.status).toBe(400);
  });

  it("rate-limits repeated sign-ups from one IP", async () => {
    // Limit is 5 per hour per IP.
    for (let i = 0; i < 5; i++) {
      await POST(
        makeRequest(
          { ...validBody, email: `user${i}@example.com` },
          "10.1.9.9"
        )
      );
    }
    const response = await POST(
      makeRequest({ ...validBody, email: "user6@example.com" }, "10.1.9.9")
    );
    expect(response.status).toBe(429);
  });
});
