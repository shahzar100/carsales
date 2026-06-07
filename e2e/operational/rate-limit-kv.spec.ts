import { test, expect } from "@playwright/test";
import { closeDb, seedAdmin } from "./_db";

/**
 * Distributed rate limiting via the KV (Upstash-REST) backend.
 *  - admin login is capped at 5/15min/IP → the 6th attempt is 429,
 *  - and the fake Upstash actually received the INCRs (proves KV path, not
 *    the in-memory fallback),
 *  - and a KV outage on a credential limiter fails CLOSED (denies).
 */
const KV = process.env.OP_KV_URL!;
const ORIGIN = "http://localhost:3000";

async function loginAttempt(request: import("@playwright/test").APIRequestContext, ip: string) {
  return request.post("/api/admin/login", {
    headers: { origin: ORIGIN, "x-forwarded-for": ip, "content-type": "application/json" },
    data: { username: "nobody", password: "wrong-password" },
  });
}

test.describe.serial("operational: KV-backed rate limiting", () => {
  test.beforeAll(async () => {
    // Ensure the adminUsers collection exists. The login route calls
    // listIndexes() on it, which throws "ns does not exist" on a brand-new DB
    // (a real edge case, masked in prod because setup-admin creates the admin
    // first). We log in with bogus creds, so the row contents don't matter.
    await seedAdmin("op-rl-placeholder", "x".repeat(12), "staff");
    // Start from a clean limiter so the 5-then-429 assertion is deterministic
    // regardless of what ran before (the limiter keys on the shared dev IP).
    await fetch(`${KV}/_fail/off`).catch(() => {});
    await fetch(`${KV}/_reset`).catch(() => {});
  });
  test.afterAll(async () => {
    await closeDb();
  });

  test("6th admin login from one IP is 429, and KV received the INCRs", async ({
    request,
  }) => {
    const before = (await (await fetch(`${KV}/_stats`)).json()).incrCalls as number;

    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await loginAttempt(request, "9.9.9.1")).status());
    }
    // First 5 are 401 (bad creds, allowed); the 6th trips the limiter.
    expect(statuses.slice(0, 5).every((s) => s === 401), `got ${statuses}`).toBe(true);
    expect(statuses[5], `got ${statuses}`).toBe(429);

    const after = (await (await fetch(`${KV}/_stats`)).json()).incrCalls as number;
    expect(after - before, "KV INCR must have run for each attempt").toBeGreaterThanOrEqual(6);
  });

  test("KV outage fails CLOSED on the login limiter (denies)", async ({ request }) => {
    await fetch(`${KV}/_fail/on`);
    try {
      // Fresh IP so we're not pre-limited; with KV erroring, failClosed denies.
      const res = await loginAttempt(request, "9.9.9.2");
      expect(res.status()).toBe(429);
    } finally {
      await fetch(`${KV}/_fail/off`);
    }
  });
});
