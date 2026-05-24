import { NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { ObjectId } from "mongodb";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import {
  ok,
  badRequest,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";

// Public car-lookup-by-id endpoint. Each call runs an indexed `$in`
// query but the input is attacker-controlled — keep a defensive cap so
// it can't be pointed at Atlas as an amplification target. 120/min/IP
// is well above any real "Saved cars" client churn.
const carsLookupLimiter = createRateLimiter("public-cars-lookup", {
  maxRequests: 120,
  windowMs: 60 * 1000,
});

/**
 * Public car lookup by id — `GET /api/cars?ids=<id>,<id>,…`
 *
 * Backs the customer "Saved cars" page and the account "Saved" tab: the
 * saved-car ids live in the browser (SavedCarsContext) and this endpoint
 * returns the full car records for them.
 *
 * Only `status: "available"` cars are returned, so a car that has since
 * sold simply drops off the saved list. Public + read-only — the whole
 * fleet is already browsable — and the id list is de-duplicated and
 * capped so the `$in` query stays bounded.
 *
 * Response: `{ success: true, data: { cars: CarInterface[] } }`.
 */

// Saved lists are capped at 50 in SavedCarsContext; allow some headroom.
const MAX_IDS = 100;

export async function GET(request: NextRequest) {
  try {
    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await carsLookupLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const idsParam = new URL(request.url).searchParams.get("ids");
    if (!idsParam) {
      return badRequest("An `ids` query parameter is required");
    }

    // Parse, trim, de-duplicate, keep only well-formed ObjectIds, cap.
    const objectIds = [...new Set(idsParam.split(","))]
      .map((s) => s.trim())
      .filter((s) => ObjectId.isValid(s))
      .slice(0, MAX_IDS)
      .map((s) => new ObjectId(s));

    if (objectIds.length === 0) {
      return ok({ cars: [] });
    }

    const carsCollection = await getCarsCollection();
    const cars = await carsCollection
      .find({ _id: { $in: objectIds } as never, status: "available" })
      .toArray();

    return ok({ cars: cars.map((car) => serializeDocument(car)) });
  } catch (error) {
    logError(error, { route: "GET /api/cars" });
    return serverError();
  }
}
