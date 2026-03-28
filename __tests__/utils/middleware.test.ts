import { middleware } from "@/middleware";
import { NextRequest, NextResponse } from "next/server";

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
});
