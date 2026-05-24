import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";

import clientPromise from "@/lib/mongodb";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";

/**
 * Public uptime/health probe.
 *
 * Designed to be hit by external uptime monitors (UptimeRobot, Pingdom,
 * Better Uptime, etc.) — no auth, no cache, deterministic shape.
 *
 * Response body is identical on 200 (all checks `"ok"`) and 503 (any
 * check failed). Monitors can alert on either `status !== 200` OR
 * `body.checks.<x> !== "ok"`, whichever they prefer.
 *
 * Rate limited to 60 req/min/IP. The DB ping is cheap but unbounded
 * external calls against this route would still amplify load on Atlas —
 * the limiter is the cost cap, not an anti-abuse measure (hence fail
 * open: a KV blip should not lock our monitor out).
 *
 * Process probes (uptime / memory / nodeVersion / region) are included
 * as informational fields — they never affect the 200/503 contract.
 * 503 is reserved for DB/KV unavailability only. High memory surfaces
 * as a soft `warnings: ["high-memory"]` flag on a 200 response so
 * monitors can chart trend without paging on-call.
 */

const PING_TIMEOUT_MS = 1500;

/**
 * Soft warning threshold for heap usage. Vercel serverless functions
 * default to 1024MB memory; 400MB is ~40% of that and a useful early
 * signal of a leak before the Lambda hits OOM. Adjust if memory size
 * is tuned in `vercel.json`.
 */
const MEMORY_WARN_BYTES = 400 * 1024 * 1024;

const healthLimiter = createRateLimiter("health", {
  maxRequests: 60,
  windowMs: 60 * 1000,
});

type CheckState = "ok" | "error" | "unconfigured";

interface HealthBody {
  status: "ok" | "error";
  version: string;
  checks: {
    db: CheckState;
    kv: CheckState;
  };
  uptimeSeconds: number;
  nodeVersion: string;
  memory: {
    rss: number;
    heapUsed: number;
  };
  region: string | null;
  warnings?: string[];
}

/**
 * Race a promise against a timeout. The timer is cleared in `finally` so
 * a fast resolution doesn't leave a dangling timeout pinned to the
 * event loop.
 */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([p, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

async function checkDb(): Promise<CheckState> {
  try {
    const client = await withTimeout(clientPromise, PING_TIMEOUT_MS);
    await withTimeout(client.db().command({ ping: 1 }), PING_TIMEOUT_MS);
    return "ok";
  } catch (error) {
    logError(error, { route: "GET /api/health", check: "db" });
    return "error";
  }
}

async function checkKv(): Promise<CheckState> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url) return "unconfigured";

  try {
    // Upstash REST exposes /ping → `{"result":"PONG"}`. Same call shape
    // the rate-limit module uses (see src/lib/utils/rateLimit.ts).
    const res = await withTimeout(
      fetch(`${url}/ping`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      }),
      PING_TIMEOUT_MS
    );
    if (!res.ok) {
      throw new Error(`KV ping ${res.status}`);
    }
    return "ok";
  } catch (error) {
    logError(error, { route: "GET /api/health", check: "kv" });
    return "error";
  }
}

export async function GET(request: NextRequest) {
  const ip = ipAddress(request) || "unknown";
  const { allowed, resetIn } = await healthLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  const [db, kv] = await Promise.all([checkDb(), checkKv()]);

  // KV being "unconfigured" is a soft state — fine in dev and pre-KV
  // production. Only "error" counts as a failure.
  const healthy = db === "ok" && kv !== "error";

  const mem = process.memoryUsage();
  const warnings: string[] = [];
  if (mem.heapUsed > MEMORY_WARN_BYTES) {
    warnings.push("high-memory");
  }

  const body: HealthBody = {
    status: healthy ? "ok" : "error",
    version: process.env.npm_package_version || "unknown",
    checks: { db, kv },
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.versions.node,
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
    },
    region: process.env.VERCEL_REGION ?? null,
    ...(warnings.length > 0 ? { warnings } : {}),
  };

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
