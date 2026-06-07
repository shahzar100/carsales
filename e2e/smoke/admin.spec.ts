import { test, expect, type Page } from "@playwright/test";
import { smoke, hasAdmin } from "./_env";

/**
 * Admin + S3 pipeline on the deploy: admin can authenticate, the upload route
 * mints a presigned URL (real AWS creds), and an existing car image optimizes
 * through next/image (proves the S3/CloudFront host is in remotePatterns).
 * Staging-only (logs in + signs a billable S3 URL).
 */
test("admin login + presign + existing image renders", async ({ page, request }) => {
  test.skip(!hasAdmin, "SMOKE_ADMIN_* not set — staging only");

  const login = await request.post("/api/admin/login", {
    headers: { origin: smoke.origin },
    data: { username: smoke.admin.username, password: smoke.admin.password },
  });
  expect(login.status(), "admin login").toBe(200);

  const pre = await request.post("/api/admin/upload", {
    headers: { origin: smoke.origin },
    data: { contentType: "image/png", fileName: "smoke.png", folder: "cars", contentLength: 100 },
  });
  expect(pre.status(), "presign upload URL").toBe(200);
  const body = await pre.json();
  expect(String(body.uploadUrl)).toMatch(/^https?:\/\//);

  // A stored remote image should optimize without a 400 "url not allowed".
  const remoteImage = await firstRemoteCarImage(page);
  if (remoteImage) {
    const img = await request.get(
      `/_next/image?url=${encodeURIComponent(remoteImage)}&w=256&q=75`
    );
    expect(img.status(), `next/image render of ${remoteImage}`).toBeLessThan(400);
  }
});

async function firstRemoteCarImage(page: Page) {
  return page.evaluate(async () => {
    const r = await fetch("/api/cars");
    const j = await r.json().catch(() => null);
    const list = Array.isArray(j) ? j : (j?.data ?? j?.cars ?? []);
    const c = list.find((x: { image?: string }) => x.image && /^https?:\/\//.test(x.image));
    return c?.image ?? null;
  });
}
