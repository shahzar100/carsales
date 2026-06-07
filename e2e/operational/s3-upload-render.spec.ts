import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";
import { closeDb, seedAdmin } from "./_db";

/**
 * S3 image pipeline against an S3-compatible store (fake endpoint via
 * AWS_S3_ENDPOINT):
 *  - the presign route validates content-type + size and returns a URL on the
 *    configured endpoint/bucket,
 *  - a presigned PUT actually stores a publicly-retrievable object,
 *  - and next/image's remotePatterns allow the real S3 host (the #1 "uploads
 *    but won't render" config bug).
 *
 * Auth is established via the login API (not the UI) so the test never waits on
 * the heavy /admin/dashboard compile — the `request` context shares cookies.
 */
const ADMIN = { u: "op-admin", p: "OpPass123!" };
const ORIGIN = "http://localhost:3000";

async function loginAdmin(request: APIRequestContext) {
  const res = await request.post("/api/admin/login", {
    headers: { origin: ORIGIN },
    data: { username: ADMIN.u, password: ADMIN.p },
  });
  expect(res.status(), "admin login").toBe(200);
}

async function presign(request: APIRequestContext, body: Record<string, unknown>) {
  const res = await request.post("/api/admin/upload", {
    headers: { origin: ORIGIN },
    data: body,
  });
  return { status: res.status(), body: await res.json().catch(() => ({})) };
}

test.describe.configure({ timeout: 120_000 });

test.describe.serial("operational: S3 upload + render", () => {
  test.beforeAll(async () => {
    await seedAdmin(ADMIN.u, ADMIN.p, "admin");
    // Clear all rate-limit buckets so our admin logins aren't blocked by the
    // login limiter the rate-limit spec deliberately exhausts earlier in the
    // run (the limiter keys on the connection IP, which is shared in dev), and
    // make sure KV isn't left in fail-mode.
    const kv = process.env.OP_KV_URL;
    await fetch(`${kv}/_fail/off`).catch(() => {});
    await fetch(`${kv}/_reset`).catch(() => {});
    // Warm the login route so the first attempt isn't racing a cold compile.
    const ctx = await pwRequest.newContext({ baseURL: ORIGIN });
    await ctx
      .post("/api/admin/login", {
        headers: { origin: ORIGIN },
        data: { username: "warmup", password: "warmup" },
        timeout: 90_000,
      })
      .catch(() => {});
    await ctx.dispose();
    await fetch(`${kv}/_reset`).catch(() => {});
  });
  test.afterAll(async () => {
    await closeDb();
  });

  test("presign validates content-type and size", async ({ request }) => {
    await loginAdmin(request);

    const ok = await presign(request, {
      contentType: "image/png",
      fileName: "test.png",
      folder: "cars",
      contentLength: 70,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(ok.body.publicUrl).toContain("mmc-test-bucket");
    expect(ok.body.publicUrl).toContain("127.0.0.1"); // the configured endpoint

    const badType = await presign(request, {
      contentType: "application/x-msdownload",
      fileName: "evil.exe",
      folder: "cars",
      contentLength: 70,
    });
    expect(badType.status).toBe(400);

    const tooBig = await presign(request, {
      contentType: "image/png",
      fileName: "huge.png",
      folder: "cars",
      contentLength: 20 * 1024 * 1024,
    });
    expect(tooBig.status).toBe(413);
  });

  test("presigned PUT stores a publicly-retrievable object", async ({ request }) => {
    await loginAdmin(request);

    const pre = await presign(request, {
      contentType: "image/png",
      fileName: "pic.png",
      folder: "cars",
      contentLength: 70,
    });
    expect(pre.status, JSON.stringify(pre.body)).toBe(200);

    const bytes = Buffer.from(Array.from({ length: 70 }, (_, i) => i % 256));
    const put = await request.put(pre.body.uploadUrl, {
      headers: { "content-type": "image/png" },
      data: bytes,
    });
    expect(put.status(), "presigned PUT should store the object").toBe(200);

    const get = await request.get(pre.body.publicUrl);
    expect(get.status(), "uploaded object should be retrievable").toBe(200);
    expect((await get.body()).length).toBe(70);
    expect(get.headers()["content-type"]).toContain("image/png");
  });

  test("next/image allows the real S3 host (remotePatterns)", async ({ request }) => {
    const s3Url = "https://mmc.s3.eu-west-2.amazonaws.com/cars/example.webp";
    const res = await request.get(
      `/_next/image?url=${encodeURIComponent(s3Url)}&w=128&q=75`
    );
    // A disallowed host returns 400 "url ... is not allowed". Anything else
    // (the optimizer attempted the upstream fetch) means the host passed.
    expect(res.status(), "S3 host should be allowed by remotePatterns").not.toBe(400);
  });
});
