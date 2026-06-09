/**
 * @jest-environment node
 *
 * Uses NextRequest which depends on the global `Request` constructor —
 * available in Jest's node environment, NOT in jsdom.
 */
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("middleware", () => {
  const createRequest = (
    method: string,
    path: string,
    headers: Record<string, string> = {}
  ) => {
    const url = `http://localhost:3000${path}`;
    return new NextRequest(url, {
      method,
      headers: new Headers(headers),
    });
  };

  it("allows GET requests without Origin", () => {
    const req = createRequest("GET", "/api/cars");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("blocks POST without Origin header", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
    // Check body
  });

  it("blocks POST with mismatched Origin", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
      origin: "http://evil.com",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });

  it("allows POST with matching Origin", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("allows PUT with matching Origin", () => {
    const req = createRequest("PUT", "/api/cars/1", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("allows DELETE with matching Origin", () => {
    const req = createRequest("DELETE", "/api/cars/1", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("allows cron routes without Origin", () => {
    const req = createRequest("POST", "/api/cron/review-invites", {
      host: "localhost:3000",
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("blocks POST with invalid Origin URL", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
      origin: "not-a-valid-url",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });

  it("blocks PATCH without Origin", () => {
    const req = createRequest("PATCH", "/api/cars/1", {
      host: "localhost:3000",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });

  describe("CSP — two-tier (admin nonce vs public static)", () => {
    it("uses a nonce + strict-dynamic on /admin/* (dynamically rendered)", () => {
      const req = createRequest("GET", "/admin/dashboard");
      const res = middleware(req);
      const csp = res.headers.get("Content-Security-Policy");
      expect(csp).toBeTruthy();
      expect(csp).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
      expect(csp).toContain("'strict-dynamic'");
      // A nonce disables 'unsafe-inline', so it must be absent on the admin tier.
      const scriptDirective = csp!
        .split(";")
        .find((d: string) => d.trim().startsWith("script-src"));
      expect(scriptDirective).not.toContain("'unsafe-inline'");
    });

    it("uses 'self' 'unsafe-inline' (no nonce) on public pages so static HTML works", () => {
      const req = createRequest("GET", "/");
      const res = middleware(req);
      const csp = res.headers.get("Content-Security-Policy");
      expect(csp).toBeTruthy();
      const scriptDirective = csp!
        .split(";")
        .find((d: string) => d.trim().startsWith("script-src"))!;
      expect(scriptDirective).toContain("'self'");
      expect(scriptDirective).toContain("'unsafe-inline'");
      // No per-request nonce on static pages — it could never match the
      // build-time HTML, and its presence would void 'unsafe-inline'.
      expect(scriptDirective).not.toContain("nonce-");
      expect(scriptDirective).not.toContain("'strict-dynamic'");
    });

    it("does not set CSP on /api routes (they don't render HTML)", () => {
      const req = createRequest("GET", "/api/cars");
      const res = middleware(req);
      expect(res.headers.get("Content-Security-Policy")).toBeNull();
    });

    it("generates a fresh nonce per request on the admin tier", () => {
      const a = middleware(createRequest("GET", "/admin/dashboard"));
      const b = middleware(createRequest("GET", "/admin/dashboard"));
      const noncePattern = /'nonce-([A-Za-z0-9+/=]+)'/;
      const nonceA = a.headers.get("Content-Security-Policy")!.match(noncePattern)?.[1];
      const nonceB = b.headers.get("Content-Security-Policy")!.match(noncePattern)?.[1];
      expect(nonceA).toBeTruthy();
      expect(nonceB).toBeTruthy();
      expect(nonceA).not.toBe(nonceB);
    });

    it("permits Cloudflare Turnstile in script-src and frame-src", () => {
      const req = createRequest("GET", "/contact");
      const res = middleware(req);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("https://challenges.cloudflare.com");
      expect(csp).toMatch(/frame-src[^;]*challenges\.cloudflare\.com/);
    });

    it("denies all framing via frame-ancestors 'none'", () => {
      const req = createRequest("GET", "/");
      const res = middleware(req);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("blocks legacy plugin embedding via object-src 'none'", () => {
      const req = createRequest("GET", "/");
      const res = middleware(req);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("object-src 'none'");
    });

    it("emits upgrade-insecure-requests in production only", () => {
      // Gated to production (dev speaks plain HTTP, so upgrading would break
      // localhost asset fetches). Flip NODE_ENV around the call to assert both.
      const prev = process.env.NODE_ENV;
      const req = createRequest("GET", "/");

      Object.assign(process.env, { NODE_ENV: "production" });
      try {
        const prodCsp = middleware(req).headers.get("Content-Security-Policy")!;
        expect(prodCsp).toContain("upgrade-insecure-requests");
      } finally {
        Object.assign(process.env, { NODE_ENV: prev });
      }

      const devCsp = middleware(req).headers.get("Content-Security-Policy")!;
      expect(devCsp).not.toContain("upgrade-insecure-requests");
    });

    it("still emits a report-only mirror for tighter style-src observation", () => {
      const req = createRequest("GET", "/");
      const res = middleware(req);
      const reportOnly = res.headers.get("Content-Security-Policy-Report-Only");
      expect(reportOnly).toBeTruthy();
      expect(reportOnly).toContain("style-src 'self'");
      expect(reportOnly).not.toContain("style-src 'self' 'unsafe-inline'");
    });
  });
});
