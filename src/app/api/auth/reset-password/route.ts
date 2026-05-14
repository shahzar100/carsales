import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";

import { getUsersCollection } from "@/lib/models";
import { hashPassword } from "@/lib/utils/auth";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import { ok, badRequest, tooManyRequests, serverError } from "@/lib/utils/apiResponse";

/**
 * POST /api/auth/reset-password — Body: { token, newPassword }
 *
 * Consumer side of the reset flow started by
 * `/api/auth/forgot-password`. Accepts the plaintext token from the
 * email link, hashes it, finds the matching unexpired `users` row, and
 * sets the new password — clearing the token in the same atomic write
 * so the link can't be replayed.
 *
 * The 8-char minimum matches `/api/auth/register`, so the rule is the
 * same whether a password is being set at sign-up or reset here.
 * Unauthenticated by design.
 */

// 5 attempts / 15 min per IP — guards against brute-forcing the token.
const consumeLimiter = createRateLimiter("customerPasswordResetConsume", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid or expired reset link"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { allowed, resetIn } = await consumeLimiter.check(ip);
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

    const { token, newPassword } = parsed.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const users = await getUsersCollection();
    const user = await users.findOne({
      resetToken: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return badRequest("This reset link is invalid or has expired.");
    }

    const passwordHash = await hashPassword(newPassword);
    await users.updateOne(
      { _id: user._id },
      {
        $set: { password: passwordHash, updatedAt: new Date() },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      }
    );

    return ok({ message: "Password updated. You can now sign in." });
  } catch (error) {
    logError(error, { route: "POST /api/auth/reset-password" });
    return serverError();
  }
}
