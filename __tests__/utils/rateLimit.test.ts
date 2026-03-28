import { createRateLimiter } from "@/lib/utils/rateLimit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows requests within the limit", () => {
    const limiter = createRateLimiter("test-allow", {
      maxRequests: 5,
      windowMs: 60000,
    });

    const result = limiter.check("user1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks remaining requests correctly", () => {
    const limiter = createRateLimiter("test-remaining", {
      maxRequests: 3,
      windowMs: 60000,
    });

    const r1 = limiter.check("user1");
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("user1");
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("user1");
    expect(r3.remaining).toBe(0);
    expect(r3.allowed).toBe(true); // Still allowed (exactly at limit)
  });

  it("blocks requests over the limit", () => {
    const limiter = createRateLimiter("test-block", {
      maxRequests: 2,
      windowMs: 60000,
    });

    limiter.check("user1"); // 1
    limiter.check("user1"); // 2
    const result = limiter.check("user1"); // 3 - over limit

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const limiter = createRateLimiter("test-reset", {
      maxRequests: 2,
      windowMs: 60000,
    });

    limiter.check("user1");
    limiter.check("user1");
    const blocked = limiter.check("user1");
    expect(blocked.allowed).toBe(false);

    // Advance time past window
    jest.advanceTimersByTime(61000);

    const afterReset = limiter.check("user1");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it("tracks different identifiers independently", () => {
    const limiter = createRateLimiter("test-independent", {
      maxRequests: 1,
      windowMs: 60000,
    });

    const r1 = limiter.check("user1");
    expect(r1.allowed).toBe(true);

    const r2 = limiter.check("user2");
    expect(r2.allowed).toBe(true);

    // user1 should now be blocked
    const r3 = limiter.check("user1");
    expect(r3.allowed).toBe(false);

    // user2 should also be blocked
    const r4 = limiter.check("user2");
    expect(r4.allowed).toBe(false);
  });

  it("returns correct resetIn value", () => {
    const limiter = createRateLimiter("test-resetIn", {
      maxRequests: 5,
      windowMs: 60000,
    });

    const result = limiter.check("user1");
    expect(result.resetIn).toBe(60000);
  });

  it("reset() clears a specific identifier", () => {
    const limiter = createRateLimiter("test-manual-reset", {
      maxRequests: 1,
      windowMs: 60000,
    });

    limiter.check("user1"); // Use up the limit
    const blocked = limiter.check("user1");
    expect(blocked.allowed).toBe(false);

    limiter.reset("user1");

    const afterReset = limiter.check("user1");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(0);
  });

  it("named limiters are independent", () => {
    const limiterA = createRateLimiter("limiter-a", {
      maxRequests: 1,
      windowMs: 60000,
    });
    const limiterB = createRateLimiter("limiter-b", {
      maxRequests: 1,
      windowMs: 60000,
    });

    limiterA.check("user1");
    const blockedA = limiterA.check("user1");
    expect(blockedA.allowed).toBe(false);

    // limiterB should still allow user1
    const allowedB = limiterB.check("user1");
    expect(allowedB.allowed).toBe(true);
  });

  it("purges stale entries when store exceeds 100", () => {
    const limiter = createRateLimiter("test-purge", {
      maxRequests: 10,
      windowMs: 1000,
    });

    // Add 101 entries
    for (let i = 0; i < 101; i++) {
      limiter.check(`user-${i}`);
    }

    // Advance past window so entries become stale
    jest.advanceTimersByTime(2000);

    // This check should trigger purge and still work
    const result = limiter.check("new-user");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});
