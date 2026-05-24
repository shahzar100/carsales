/**
 * @jest-environment node
 *
 * Uses NextRequest which depends on the global `Request` constructor —
 * available in Jest's node environment, NOT in jsdom.
 */
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

describe("proxy", () => {
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
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("blocks POST without Origin header", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
    });
    const res = proxy(req);
    expect(res.status).toBe(403);
    // Check body
  });

  it("blocks POST with mismatched Origin", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
      origin: "http://evil.com",
    });
    const res = proxy(req);
    expect(res.status).toBe(403);
  });

  it("allows POST with matching Origin", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("allows PUT with matching Origin", () => {
    const req = createRequest("PUT", "/api/cars/1", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("allows DELETE with matching Origin", () => {
    const req = createRequest("DELETE", "/api/cars/1", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("allows cron routes without Origin", () => {
    const req = createRequest("POST", "/api/cron/review-invites", {
      host: "localhost:3000",
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("blocks POST with invalid Origin URL", () => {
    const req = createRequest("POST", "/api/cars", {
      host: "localhost:3000",
      origin: "not-a-valid-url",
    });
    const res = proxy(req);
    expect(res.status).toBe(403);
  });

  it("blocks PATCH without Origin", () => {
    const req = createRequest("PATCH", "/api/cars/1", {
      host: "localhost:3000",
    });
    const res = proxy(req);
    expect(res.status).toBe(403);
  });

  describe("CSP nonce (page routes)", () => {
    it("sets a Content-Security-Policy header with a nonce on page requests", () => {
      const req = createRequest("GET", "/");
      const res = proxy(req);
      const csp = res.headers.get("Content-Security-Policy");
      expect(csp).toBeTruthy();
      expect(csp).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
      expect(csp).toContain("'strict-dynamic'");
      // We dropped 'unsafe-inline' from script-src
      const scriptDirective = csp!
        .split(";")
        .find((d: string) => d.trim().startsWith("script-src"));
      expect(scriptDirective).not.toContain("'unsafe-inline'");
    });

    it("does not set CSP on /api routes (they don't render HTML)", () => {
      const req = createRequest("GET", "/api/cars");
      const res = proxy(req);
      expect(res.headers.get("Content-Security-Policy")).toBeNull();
    });

    it("generates a fresh nonce per request", () => {
      const a = proxy(createRequest("GET", "/"));
      const b = proxy(createRequest("GET", "/"));
      const noncePattern = /'nonce-([A-Za-z0-9+/=]+)'/;
      const nonceA = a.headers.get("Content-Security-Policy")!.match(noncePattern)?.[1];
      const nonceB = b.headers.get("Content-Security-Policy")!.match(noncePattern)?.[1];
      expect(nonceA).toBeTruthy();
      expect(nonceB).toBeTruthy();
      expect(nonceA).not.toBe(nonceB);
    });

    it("permits Cloudflare Turnstile in script-src and frame-src", () => {
      const req = createRequest("GET", "/contact");
      const res = proxy(req);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("https://challenges.cloudflare.com");
      expect(csp).toMatch(/frame-src[^;]*challenges\.cloudflare\.com/);
    });

    it("denies all framing via frame-ancestors 'none'", () => {
      const req = createRequest("GET", "/");
      const res = proxy(req);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("blocks legacy plugin embedding via object-src 'none'", () => {
      const req = createRequest("GET", "/");
      const res = proxy(req);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("object-src 'none'");
    });

    it("emits upgrade-insecure-requests", () => {
      const req = createRequest("GET", "/");
      const res = proxy(req);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it("still emits a report-only mirror for tighter style-src observation", () => {
      const req = createRequest("GET", "/");
      const res = proxy(req);
      const reportOnly = res.headers.get("Content-Security-Policy-Report-Only");
      expect(reportOnly).toBeTruthy();
      expect(reportOnly).toContain("style-src 'self'");
      expect(reportOnly).not.toContain("style-src 'self' 'unsafe-inline'");
    });
  });
});
