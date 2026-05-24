import { NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { z } from "zod";

import { auth } from "@/auth";
import { getUsersCollection } from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import {
  ok,
  badRequest,
  unauthorized,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";

// The client PUTs the full saved list on every add/remove, so real
// users hit this often. 60 writes / 5 min covers that; anything past it
// is a runaway client or a scraper.
const savedLimiter = createRateLimiter("customerSavedUpdate", {
  maxRequests: 60,
  windowMs: 5 * 60 * 1000,
});

/**
 * Server-persisted saved-cars list for signed-in customers.
 *
 * Anonymous visitors keep using the localStorage-only list in
 * SavedCarsContext. Once signed in, that context mirrors its state here
 * with PUT (full-list replace) so the wishlist follows the customer
 * across devices. GET is what the context reads on sign-in to merge the
 * two sources.
 *
 * Keyed by `session.user.email` rather than id: email is unique, always
 * present for every provider, and avoids an ObjectId round-trip.
 */

// Mirrors SAVED_CARS_MAX in SavedCarsContext — the cap is enforced on
// both ends so a tampered request can't bloat the user document.
const SAVED_CARS_MAX = 50;

const savedSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).max(SAVED_CARS_MAX),
});

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return unauthorized("You must be signed in");

    const users = await getUsersCollection();
    const user = await users.findOne(
      { email },
      { projection: { savedCarIds: 1 } }
    );

    return ok({ savedCarIds: user?.savedCarIds ?? [] });
  } catch (error) {
    logError(error, { route: "GET /api/account/saved" });
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return unauthorized("You must be signed in");

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await savedLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const parsed = savedSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid saved-cars payload");
    }

    // De-dupe defensively — the client should already do this, but the
    // stored list is the source of truth for other devices.
    const ids = [...new Set(parsed.data.ids)].slice(0, SAVED_CARS_MAX);

    const users = await getUsersCollection();
    await users.updateOne(
      { email },
      { $set: { savedCarIds: ids, updatedAt: new Date() } }
    );

    return ok({ savedCarIds: ids });
  } catch (error) {
    logError(error, { route: "PUT /api/account/saved" });
    return serverError();
  }
}
