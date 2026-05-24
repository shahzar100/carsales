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
  notFound,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";

// Light cap: 20 profile edits / 15 min per IP. Real users rename
// themselves once in a blue moon; this stops a compromised account being
// used to churn the users collection.
const profileLimiter = createRateLimiter("customerProfileUpdate", {
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
});

/**
 * GET  /api/account/profile — the signed-in customer's profile, plus the
 *      two derived flags the Settings UI needs to render itself:
 *        - `hasPassword`   → "Change password" vs "Set a password"
 *        - `emailVerified` → whether to show the verify-email banner
 *
 * PATCH /api/account/profile — Body: { name } — updates the display name.
 *      The client then calls `useSession().update({ name })` so the JWT
 *      session reflects it without a re-login (see the jwt callback in
 *      src/auth.ts).
 */

const patchSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return unauthorized("You must be signed in");

    const users = await getUsersCollection();
    const user = await users.findOne(
      { email },
      { projection: { name: 1, email: 1, password: 1, emailVerified: 1 } }
    );
    if (!user) return notFound("Account not found");

    return ok({
      name: user.name ?? "",
      email: user.email,
      hasPassword: Boolean(user.password),
      emailVerified: Boolean(user.emailVerified),
    });
  } catch (error) {
    logError(error, { route: "GET /api/account/profile" });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return unauthorized("You must be signed in");

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await profileLimiter.check(ip);
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

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid name");
    }

    const users = await getUsersCollection();
    await users.updateOne(
      { email },
      { $set: { name: parsed.data.name, updatedAt: new Date() } }
    );

    return ok({ name: parsed.data.name });
  } catch (error) {
    logError(error, { route: "PATCH /api/account/profile" });
    return serverError();
  }
}
