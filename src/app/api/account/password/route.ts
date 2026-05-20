import { NextRequest } from "next/server";
import { z } from "zod";
import { ipAddress } from "@vercel/functions";

import { auth } from "@/auth";
import { getUsersCollection } from "@/lib/models";
import { hashPassword, verifyPassword } from "@/lib/utils/auth";
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

/**
 * POST /api/account/password — change (or set) the signed-in customer's
 * password. Body: { currentPassword?, newPassword }.
 *
 * Two cases:
 *   - The account already has a password → `currentPassword` is required
 *     and must match (so a hijacked session can't silently rotate it).
 *   - The account has no password (Google / magic-link only) → this sets
 *     one for the first time; `currentPassword` is ignored.
 *
 * 8-char minimum matches /api/auth/register and /api/auth/reset-password.
 */

const limiter = createRateLimiter("customerPasswordChange", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  failClosed: true,
});

const schema = z.object({
  currentPassword: z.string().max(200).optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(200),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return unauthorized("You must be signed in");

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await limiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many attempts. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid request body"
      );
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    if (!user) return notFound("Account not found");

    // Only enforce the current-password check when one is actually set.
    if (user.password) {
      if (!parsed.data.currentPassword) {
        return badRequest("Your current password is required");
      }
      const valid = await verifyPassword(
        parsed.data.currentPassword,
        user.password
      );
      if (!valid) return badRequest("Your current password is incorrect");
    }

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: await hashPassword(parsed.data.newPassword),
          updatedAt: new Date(),
        },
      }
    );

    return ok({ message: "Password updated." });
  } catch (error) {
    logError(error, { route: "POST /api/account/password" });
    return serverError();
  }
}
