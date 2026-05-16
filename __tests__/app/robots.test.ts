/**
 * @jest-environment node
 *
 * Tests for src/app/robots.ts
 *
 * Standards coverage:
 * - 🔒 SEO/Security: admin & API namespaces are disallowed, public root is allowed
 * - 📋 Functional: sitemap URL is derived from NEXT_PUBLIC_SITE_URL with a sane default
 */

import robots from "@/app/robots";

describe("robots", () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;
  afterAll(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
  });

  it("🔒 disallows /admin/, /api/, and /Booking/ for all crawlers", () => {
    const out = robots();
    expect(out.rules).toEqual([
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
        disallow: expect.arrayContaining(["/admin/", "/api/", "/Booking/"]),
      }),
    ]);
  });

  it("uses NEXT_PUBLIC_SITE_URL for the sitemap URL when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    expect(robots().sitemap).toBe("https://example.test/sitemap.xml");
  });

  it("falls back to localhost:3000 when NEXT_PUBLIC_SITE_URL is empty", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(robots().sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
