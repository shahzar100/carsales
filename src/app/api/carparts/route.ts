import { NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { getCarPartsCollection, serializeDocument } from "@/lib/models";
import { ok, tooManyRequests, serverError } from "@/lib/utils/apiResponse";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";

// Public listing — full collection scan with optional filters. 120/min
// is high enough that legitimate browsing (and the saved-cars sync)
// stays well under the cap, low enough that a scraper hits 429 fast.
const carPartsListLimiter = createRateLimiter("public-carparts-list", {
  maxRequests: 120,
  windowMs: 60 * 1000,
});

/**
 * GET /api/carparts — public car-parts listing.
 *
 * Read-only. This route previously auto-seeded the collection with mock
 * data whenever it was empty, which meant an unauthenticated GET could
 * trigger a database write (and quietly resurrect mock inventory in
 * production). Seeding has been removed — an empty collection now simply
 * returns `[]`. Real inventory is created through the admin API
 * (`POST /api/admin/carparts`).
 */
export async function GET(request: NextRequest) {
  try {
    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await carPartsListLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const carPartsCollection = await getCarPartsCollection();

    // Build filter from optional query params
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand");
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");

    const filter: Record<string, string> = {};
    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (condition) filter.condition = condition;

    const parts = await carPartsCollection.find(filter).toArray();

    return ok(parts.map((part) => serializeDocument(part)));
  } catch (error) {
    logError(error, { route: "GET /api/carparts" });
    return serverError();
  }
}
