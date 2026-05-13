/**
 * Featured-car cache.
 *
 * When KV_REST_API_URL is set (Vercel KV or Upstash Redis), reads/writes go
 * through the REST API so every Vercel instance shares the same cache entry.
 * Otherwise we fall back to a per-instance in-memory cache with the same TTL.
 *
 * The featured car changes infrequently (a manager toggles `featured: true`
 * on a car maybe once a week), so the cost of a single REST round-trip on
 * cache miss is acceptable, and cache hits avoid a Mongo query on every
 * home-page render.
 *
 * Day 11.2 / Finding #48.
 */

import { logError } from "@/lib/utils/observability";

export const FEATURED_CAR_TTL_SECONDS = 5 * 60;
const KEY = "featured-car";

let memoryValue: unknown = undefined;
let memoryExpiresAt = 0;

function kvConfigured(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function kvRequest(
  config: { url: string; token: string },
  path: string,
  options: { method?: string } = {}
): Promise<unknown> {
  const res = await fetch(`${config.url}${path}`, {
    method: options.method ?? "GET",
    headers: { Authorization: `Bearer ${config.token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`KV ${res.status} on ${path}`);
  }
  return res.json();
}

/** Read the cached featured car. Returns `undefined` on miss. */
export async function readFeaturedCarCache<T>(): Promise<T | null | undefined> {
  const kv = kvConfigured();
  if (!kv) {
    if (Date.now() < memoryExpiresAt) return memoryValue as T | null;
    return undefined;
  }

  try {
    const response = (await kvRequest(kv, `/get/${KEY}`)) as {
      result: string | null;
    };
    if (response.result == null) return undefined;
    // Upstash stores strings; we encode null as the literal string "null"
    // to distinguish "no featured car" (cached) from "no cache entry".
    return JSON.parse(response.result) as T | null;
  } catch (error) {
    logError(error, { context: "featuredCarCache.read" });
    return undefined;
  }
}

/** Cache the featured car (or `null` if none) for FEATURED_CAR_TTL_SECONDS. */
export async function writeFeaturedCarCache<T>(value: T | null): Promise<void> {
  const kv = kvConfigured();
  if (!kv) {
    memoryValue = value;
    memoryExpiresAt = Date.now() + FEATURED_CAR_TTL_SECONDS * 1000;
    return;
  }

  try {
    const body = encodeURIComponent(JSON.stringify(value));
    await kvRequest(
      kv,
      `/set/${KEY}/${body}?EX=${FEATURED_CAR_TTL_SECONDS}`,
      { method: "POST" }
    );
  } catch (error) {
    logError(error, { context: "featuredCarCache.write" });
  }
}

/**
 * Drop the cached entry so the next `getFeaturedCar()` re-reads from Mongo.
 * Call this from any admin route that mutates a car's `featured` flag (or any
 * field that might be displayed on the home page).
 */
export async function invalidateFeaturedCarCache(): Promise<void> {
  const kv = kvConfigured();
  if (!kv) {
    memoryValue = undefined;
    memoryExpiresAt = 0;
    return;
  }

  try {
    await kvRequest(kv, `/del/${KEY}`, { method: "POST" });
  } catch (error) {
    logError(error, { context: "featuredCarCache.invalidate" });
  }
}

/** Test helper — resets the in-memory store. Not used in production code. */
export function _resetFeaturedCarMemoryCache(): void {
  memoryValue = undefined;
  memoryExpiresAt = 0;
}
