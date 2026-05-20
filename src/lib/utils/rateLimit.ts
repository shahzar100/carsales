/**
 * Rate limiter for serverless API routes.
 *
 * In-memory by default; KV-backed (Upstash REST) when KV_REST_API_URL is
 * configured. The KV path is the one we want in production — every warm
 * Vercel instance hits the same counter, so "5 attempts per 15 minutes"
 * actually means that globally instead of per-Lambda.
 *
 * Stale entries in the in-memory store are lazily purged on each check
 * to prevent unbounded memory growth.
 */

import { logError } from "@/lib/utils/observability";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /**
   * What to do when the KV backend is unreachable (network blip / outage).
   *  - `false` / omitted — fail **open**: allow the request. Correct for
   *    anti-abuse limiters where a KV blip shouldn't take a feature down.
   *  - `true` — fail **closed**: deny the request. Correct for limiters
   *    that guard credentials (login, password reset, 2FA): a KV outage
   *    must not silently become an unlimited brute-force window.
   *
   * Only affects the KV backend; the in-memory backend never errors.
   */
  failClosed?: boolean;
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

// ── In-memory backend (dev / test / no-KV fallback) ──────────
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

// ── KV backend (Upstash REST) ────────────────────────────────
function kvConfigured(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function kvRequest(
  config: { url: string; token: string },
  path: string
): Promise<unknown> {
  // Upstash REST: every command is a GET against `/<cmd>/<arg>/...`. We POST
  // would also work; GET keeps the call shape consistent with the existing
  // featuredCarCache module.
  const res = await fetch(`${config.url}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${config.token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`KV ${res.status} on ${path}`);
  }
  return res.json();
}

function kvLimiter(name: string, opts: RateLimiterOptions): RateLimiter {
  const config = kvConfigured()!;
  const keyFor = (id: string) => `rl:${name}:${id}`;

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const key = keyFor(identifier);
      try {
        // INCR returns the new value; if it was 1 we just created the entry
        // and need to set the TTL. (TTL on each INCR would reset the window
        // every request, which is wrong.)
        const incrRes = (await kvRequest(config, `/incr/${key}`)) as {
          result: number;
        };
        const count = incrRes.result;

        if (count === 1) {
          await kvRequest(
            config,
            `/pexpire/${key}/${opts.windowMs}`
          );
        }

        const ttlRes = (await kvRequest(config, `/pttl/${key}`)) as {
          result: number;
        };
        const resetIn = ttlRes.result > 0 ? ttlRes.result : opts.windowMs;

        return {
          allowed: count <= opts.maxRequests,
          remaining: Math.max(0, opts.maxRequests - count),
          resetIn,
        };
      } catch (error) {
        // KV outage. Anti-abuse limiters fail OPEN — one bad request beats
        // locking every user out. Credential-guarding limiters
        // (`failClosed: true`) fail CLOSED — an outage must not silently
        // open an unlimited brute-force window.
        logError(error, { context: "rateLimit.kvCheck", limiter: name });
        return {
          allowed: !opts.failClosed,
          remaining: opts.failClosed ? 0 : opts.maxRequests,
          resetIn: opts.windowMs,
        };
      }
    },

    async reset(identifier: string): Promise<void> {
      try {
        await kvRequest(config, `/del/${keyFor(identifier)}`);
      } catch (error) {
        logError(error, { context: "rateLimit.kvReset", limiter: name });
      }
    },
  };
}

/**
 * Create a named rate limiter with the given options.
 *
 * @example
 * const loginLimiter = createRateLimiter("login", {
 *   maxRequests: 5,
 *   windowMs: 15 * 60 * 1000,
 *   failClosed: true, // a credential limiter — deny on KV outage
 * });
 *
 * export async function POST(req: NextRequest) {
 *   const ip = ipAddress(req) || "unknown";
 *   const { allowed, remaining, resetIn } = await loginLimiter.check(ip);
 *   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *   // ...
 * }
 */
export function createRateLimiter(
  name: string,
  opts: RateLimiterOptions
): RateLimiter {
  if (kvConfigured()) return kvLimiter(name, opts);
  return inMemoryLimiter(name, opts);
}
