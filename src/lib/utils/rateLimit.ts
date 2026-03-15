/**
 * Simple in-memory rate limiter for serverless API routes.
 *
 * Uses a Map of IP → { count, resetTime } to track requests.
 * Because Vercel serverless functions share memory across warm
 * starts, this provides reasonable protection within a single
 * instance. For stronger guarantees, use a Redis-backed solution.
 *
 * Stale entries are lazily purged on each check to prevent
 * unbounded memory growth.
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

const limiters = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Create a named rate limiter with the given options.
 *
 * @example
 * const loginLimiter = createRateLimiter("login", { maxRequests: 5, windowMs: 15 * 60 * 1000 });
 *
 * export async function POST(req: NextRequest) {
 *   const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 *   const { allowed, remaining, resetIn } = loginLimiter.check(ip);
 *   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *   // ...
 * }
 */
export function createRateLimiter(name: string, opts: RateLimiterOptions) {
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
    check(identifier: string): {
      allowed: boolean;
      remaining: number;
      resetIn: number;
    } {
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

    /** Manually reset a specific identifier (e.g. after successful login) */
    reset(identifier: string) {
      store.delete(identifier);
    },
  };
}
