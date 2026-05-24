/**
 * @jest-environment node
 *
 * Tests for /api/health route (src/app/api/health/route.ts).
 *
 * Covers:
 *  - shape: { status, version, checks: { db, kv } } on both success + failure
 *  - status code: 200 when all checks pass, 503 when any check fails
 *  - no auth: callable without any session cookie
 *  - kv = "unconfigured" when KV_REST_API_URL is unset
 */

// Mongo client mock — the health route calls `clientPromise` then `.db().command({ ping: 1 })`.
const mockPing = jest.fn();
jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({ command: (...args: unknown[]) => mockPing(...args) }),
  }),
}));

// The route ipAddress() helper comes from @vercel/functions; mock it like
// the rest of the suite (jest.setup.js also does this for api tests).
jest.mock("@vercel/functions", () => ({
  ipAddress: jest.fn(() => "10.0.0.1"),
}));

import { NextRequest } from "next/server";

function mkRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/health");
}

describe("GET /api/health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPing.mockResolvedValue({ ok: 1 });
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("returns 200 with shape {status, version, checks:{db,kv}} when db is up and kv is unconfigured", async () => {
    const { GET } = await import("@/app/api/health/route");

    const res = await GET(mkRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      version: expect.any(String),
      checks: { db: "ok", kv: "unconfigured" },
    });
  });

  it("requires no auth — no session header / cookie touched", async () => {
    const { GET } = await import("@/app/api/health/route");

    // A bare request with zero headers must still succeed. If anything in
    // the route called isAuthenticated() it would throw under jsdom-node.
    const res = await GET(mkRequest());
    expect(res.status).toBe(200);
  });

  it("returns 503 when the db ping fails", async () => {
    mockPing.mockRejectedValueOnce(new Error("connection refused"));
    const { GET } = await import("@/app/api/health/route");

    const res = await GET(mkRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("error");
    expect(body.checks.db).toBe("error");
    expect(body.checks.kv).toBe("unconfigured");
    expect(body).toHaveProperty("version");
  });

  it("returns kv:'ok' when KV is configured and reachable", async () => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok";

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: "PONG" }),
    });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    const { GET } = await import("@/app/api/health/route");
    const res = await GET(mkRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checks.kv).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.upstash.io/ping",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("returns 503 when KV is configured but unreachable", async () => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    (global as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const { GET } = await import("@/app/api/health/route");
    const res = await GET(mkRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.checks.db).toBe("ok");
    expect(body.checks.kv).toBe("error");
  });
});
