import { createRateLimiter } from "@/lib/utils/rateLimit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows requests within the limit", async () => {
    const limiter = createRateLimiter("test-allow", {
      maxRequests: 5,
      windowMs: 60000,
    });

    const result = await limiter.check("user1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks remaining requests correctly", async () => {
    const limiter = createRateLimiter("test-remaining", {
      maxRequests: 3,
      windowMs: 60000,
    });

    const r1 = await limiter.check("user1");
    expect(r1.remaining).toBe(2);

    const r2 = await limiter.check("user1");
    expect(r2.remaining).toBe(1);

    const r3 = await limiter.check("user1");
    expect(r3.remaining).toBe(0);
    expect(r3.allowed).toBe(true); // Still allowed (exactly at limit)
  });

  it("blocks requests over the limit", async () => {
    const limiter = createRateLimiter("test-block", {
      maxRequests: 2,
      windowMs: 60000,
    });

    await limiter.check("user1"); // 1
    await limiter.check("user1"); // 2
    const result = await limiter.check("user1"); // 3 - over limit

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const limiter = createRateLimiter("test-reset", {
      maxRequests: 2,
      windowMs: 60000,
    });

    await limiter.check("user1");
    await limiter.check("user1");
    const blocked = await limiter.check("user1");
    expect(blocked.allowed).toBe(false);

    // Advance time past window
    jest.advanceTimersByTime(61000);

    const afterReset = await limiter.check("user1");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it("tracks different identifiers independently", async () => {
    const limiter = createRateLimiter("test-independent", {
      maxRequests: 1,
      windowMs: 60000,
    });

    const r1 = await limiter.check("user1");
    expect(r1.allowed).toBe(true);

    const r2 = await limiter.check("user2");
    expect(r2.allowed).toBe(true);

    // user1 should now be blocked
    const r3 = await limiter.check("user1");
    expect(r3.allowed).toBe(false);

    // user2 should also be blocked
    const r4 = await limiter.check("user2");
    expect(r4.allowed).toBe(false);
  });

  it("returns correct resetIn value", async () => {
    const limiter = createRateLimiter("test-resetIn", {
      maxRequests: 5,
      windowMs: 60000,
    });

    const result = await limiter.check("user1");
    expect(result.resetIn).toBe(60000);
  });

  it("reset() clears a specific identifier", async () => {
    const limiter = createRateLimiter("test-manual-reset", {
      maxRequests: 1,
      windowMs: 60000,
    });

    await limiter.check("user1"); // Use up the limit
    const blocked = await limiter.check("user1");
    expect(blocked.allowed).toBe(false);

    await limiter.reset("user1");

    const afterReset = await limiter.check("user1");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(0);
  });

  it("named limiters are independent", async () => {
    const limiterA = createRateLimiter("limiter-a", {
      maxRequests: 1,
      windowMs: 60000,
    });
    const limiterB = createRateLimiter("limiter-b", {
      maxRequests: 1,
      windowMs: 60000,
    });

    await limiterA.check("user1");
    const blockedA = await limiterA.check("user1");
    expect(blockedA.allowed).toBe(false);

    // limiterB should still allow user1
    const allowedB = await limiterB.check("user1");
    expect(allowedB.allowed).toBe(true);
  });

  describe("KV-backed path", () => {
    const originalFetch = global.fetch;
    let calls: Array<{ url: string; init?: RequestInit }>;

    beforeEach(() => {
      process.env.KV_REST_API_URL = "https://kv.example.com";
      process.env.KV_REST_API_TOKEN = "token";
      calls = [];
      // Simulate a fresh Upstash key on first INCR (returns 1), then increment.
      let counter = 0;
      let ttl = -1;
      global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (url.includes("/incr/")) {
          counter += 1;
          return {
            ok: true,
            json: async () => ({ result: counter }),
          } as Response;
        }
        if (url.includes("/pexpire/")) {
          // pull TTL out of the URL: /pexpire/<key>/<ms>
          const ms = parseInt(url.split("/").pop() || "0", 10);
          ttl = ms;
          return { ok: true, json: async () => ({ result: 1 }) } as Response;
        }
        if (url.includes("/pttl/")) {
          return { ok: true, json: async () => ({ result: ttl }) } as Response;
        }
        if (url.includes("/del/")) {
          counter = 0;
          ttl = -1;
          return { ok: true, json: async () => ({ result: 1 }) } as Response;
        }
        return { ok: false, status: 500, json: async () => ({}) } as Response;
      }) as never;
    });

    afterEach(() => {
      global.fetch = originalFetch;
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;
    });

    it("uses INCR + pexpire on first hit, INCR alone after", async () => {
      const limiter = createRateLimiter("kv-test", {
        maxRequests: 3,
        windowMs: 60000,
      });
      const r1 = await limiter.check("ip-1");
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);
      // First check did: INCR, pexpire, pttl
      expect(
        calls.some((c) => c.url.includes("/pexpire/rl:kv-test:ip-1/60000"))
      ).toBe(true);

      calls.length = 0;
      const r2 = await limiter.check("ip-1");
      expect(r2.allowed).toBe(true);
      // No pexpire on subsequent — TTL was already set
      expect(calls.some((c) => c.url.includes("/pexpire/"))).toBe(false);
    });

    it("blocks when KV count exceeds maxRequests", async () => {
      const limiter = createRateLimiter("kv-block", {
        maxRequests: 2,
        windowMs: 60000,
      });
      await limiter.check("ip-1");
      await limiter.check("ip-1");
      const r3 = await limiter.check("ip-1");
      expect(r3.allowed).toBe(false);
    });

    it("fails open if KV returns an error", async () => {
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })) as never;
      const limiter = createRateLimiter("kv-fail-open", {
        maxRequests: 1,
        windowMs: 60000,
      });
      const result = await limiter.check("ip-1");
      // We'd rather let one bad request through than lock everyone out
      expect(result.allowed).toBe(true);
    });

    it("reset() issues DEL", async () => {
      const limiter = createRateLimiter("kv-reset", {
        maxRequests: 1,
        windowMs: 60000,
      });
      await limiter.check("ip-1");
      calls.length = 0;
      await limiter.reset("ip-1");
      expect(calls[0].url).toContain("/del/rl:kv-reset:ip-1");
    });
  });

  it("purges stale entries when store exceeds 100", async () => {
    const limiter = createRateLimiter("test-purge", {
      maxRequests: 10,
      windowMs: 1000,
    });

    // Add 101 entries
    for (let i = 0; i < 101; i++) {
      await limiter.check(`user-${i}`);
    }

    // Advance past window so entries become stale
    jest.advanceTimersByTime(2000);

    // This check should trigger purge and still work
    const result = await limiter.check("new-user");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});
