/**
 * Rate limiter for serverless API routes.
 *
 * The exposed `check()` / `reset()` API is **async** so the in-memory
 * store can later be swapped for a distributed one (Vercel KV / Upstash
 * Redis) without touching call sites. The plan calls this out as
 * WEBSITE_REVIEW Finding #13 / CODEBASE_ISSUES A12.
 *
 * Implementation today: in-memory per-instance Map. On Vercel each warm
 * instance has its own Map, so the documented "N attempts per window"
 * is in practice "N per warm instance". This is acceptable for dev and
 * low-traffic prod; for real abuse resistance, wire a KV backend (the
 * `KV_REST_API_URL` env probe at the bottom is where the swap happens).
 *
 * Stale entries are lazily purged on each check to prevent unbounded
 * memory growth.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export interface RateLimiter {
  check(identifier: string): Promise<RateLimitResult>;
  /** Manually reset a specific identifier (e.g. after successful login) */
  reset(identifier: string): Promise<void>;
}

const limiters = new Map<string, Map<string, RateLimitEntry>>();

function inMemoryLimiter(
  name: string,
  opts: RateLimiterOptions
): RateLimiter {
  if (!limiters.has(name)) {
    limiters.set(name, new Map());
  }
  const store = limiters.get(name)!;

  function purgeStale() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      // Lazily purge old entries every 100 checks
      if (store.size > 100) purgeStale();

      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || now > entry.resetTime) {
        store.set(identifier, {
          count: 1,
          resetTime: now + opts.windowMs,
        });
        return {
          allowed: true,
          remaining: opts.maxRequests - 1,
          resetIn: opts.windowMs,
        };
      }

      entry.count++;
      const remaining = Math.max(0, opts.maxRequests - entry.count);
      const resetIn = entry.resetTime - now;

      return {
        allowed: entry.count <= opts.maxRequests,
        remaining,
        resetIn,
      };
    },

    async reset(identifier: string): Promise<void> {
      store.delete(identifier);
    },
  };
}

/**
 * Create a named rate limiter with the given options.
 *
 * @example
 * const loginLimiter = createRateLimiter("login", { maxRequests: 5, windowMs: 15 * 60 * 1000 });
 *
 * export async function POST(req: NextRequest) {
 *   const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 *   const { allowed, remaining, resetIn } = await loginLimiter.check(ip);
 *   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *   // ...
 * }
 */
export function createRateLimiter(
  name: string,
  opts: RateLimiterOptions
): RateLimiter {
  // Future: when KV_REST_API_URL is set, return a KV-backed limiter here.
  // The in-memory limiter stays as the dev/test fallback.
  //
  //   if (process.env.KV_REST_API_URL) return kvLimiter(name, opts);
  //
  return inMemoryLimiter(name, opts);
}
