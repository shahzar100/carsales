import { test, expect, request as pwRequest, type Page } from "@playwright/test";
import { TOTP, Secret } from "otpauth";
import { seedAdminUser, cleanupE2EData, closeDb, getDb } from "../fixtures/db";
import { adminCredentials } from "../fixtures/test-data";

/**
 * Security-critical admin guarantees:
 *
 *  1. Role enforcement — a `staff` admin is FORBIDDEN from the admin-only
 *     password-reset route; a full `admin` is allowed (control, proving the
 *     block is role-based, not blanket). Regression guard for the privilege-
 *     escalation fix (CODEBASE_ISSUES A1, src/app/api/admin/users/password).
 *  2. TOTP 2FA — an admin can enrol end-to-end (enroll → verify) and the
 *     secret persists with totpEnabled=true (src/app/api/admin/2fa/*).
 *
 * Isolation: each test sets a unique `x-forwarded-for` so its logins land in
 * their own in-memory rate-limiter bucket — away from each other and from the
 * shared `unknown` IP that `login-failures` exhausts on purpose. (The limiter
 * keys on ipAddress(req) || "unknown"; see src/lib/utils/rateLimit.ts.)
 */
test.describe.configure({ timeout: 90_000 });

const STAFF = { username: "e2e-staff", password: "StaffPass123!", email: "e2e-staff@example.com" };
const TFA_ADMIN = {
  username: "e2e-2fa-admin",
  password: "AdminPass123!",
  email: "e2e-2fa-admin@example.com",
};

test.describe.serial("admin: role enforcement & 2FA", () => {
  test.beforeAll(async () => {
    await seedAdminUser({ ...STAFF, role: "staff" });
    // Dedicated admin for the 2FA test so we never flip 2FA on the shared
    // globalSetup admin (which other admin specs log in as).
    await seedAdminUser({ ...TFA_ADMIN, role: "admin" });

    // Warm the login API route so the first real login isn't racing a cold
    // Turbopack compile (dev only; prod routes are prebuilt).
    const ctx = await pwRequest.newContext({
      baseURL: "http://localhost:3000",
      extraHTTPHeaders: { "x-forwarded-for": "203.0.113.40" },
    });
    await ctx
      .post("/api/admin/login", {
        data: { username: "warmup", password: "warmup" },
        timeout: 90_000,
      })
      .catch(() => {});
    await ctx.dispose();
  });

  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  async function loginAdmin(page: Page, username: string, password: string) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      await page.goto("/admin/login");
      await page.getByLabel("Username").fill(username);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign In" }).click();
      try {
        await page.waitForURL(/\/admin\/dashboard/, { timeout: 45_000 });
        return;
      } catch (err) {
        if (attempt === 2) throw err;
      }
    }
  }

  async function postPasswordReset(page: Page, targetUsername: string) {
    return page.evaluate(async (target) => {
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", username: target }),
      });
      let json: unknown = {};
      try {
        json = await res.json();
      } catch {
        /* ignore */
      }
      return { status: res.status, body: JSON.stringify(json) };
    }, targetUsername);
  }

  test("staff is FORBIDDEN from the admin-only password-reset route (403)", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.41" });
    await loginAdmin(page, STAFF.username, STAFF.password);
    const res = await postPasswordReset(page, adminCredentials.username);
    expect(res.status, `body: ${res.body}`).toBe(403);
    expect(res.body.toLowerCase()).toContain("admin");
  });

  test("admin IS allowed on the same route (control)", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.42" });
    await loginAdmin(page, adminCredentials.username, adminCredentials.password);
    const res = await postPasswordReset(page, STAFF.username);
    expect(res.status, `body: ${res.body}`).toBe(200);
  });

  test("admin can enrol 2FA end-to-end (enroll → verify → persisted)", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.43" });
    await loginAdmin(page, TFA_ADMIN.username, TFA_ADMIN.password);

    const enroll = await page.evaluate(async () => {
      const res = await fetch("/api/admin/2fa/enroll", { method: "POST" });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    });
    expect(enroll.status, `enroll: ${JSON.stringify(enroll.body)}`).toBe(200);
    const secret: string = enroll.body.secret;
    expect(secret, "enroll should return a base32 secret").toBeTruthy();

    const totp = new TOTP({
      issuer: "Morley Motor Company",
      label: "verify",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    });

    const verify = await page.evaluate(async (code) => {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    }, totp.generate());
    expect(verify.status, `verify: ${JSON.stringify(verify.body)}`).toBe(200);
    expect(verify.body.success).toBe(true);

    const user = await (await getDb())
      .collection("adminUsers")
      .findOne({ username: TFA_ADMIN.username });
    expect(user?.totpEnabled).toBe(true);
    expect(typeof user?.totpSecret).toBe("string");
  });
});
