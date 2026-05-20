import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { ipAddress, waitUntil } from "@vercel/functions";
import React from "react";

import { getUsersCollection } from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import { sendEmail } from "@/emails/send";
import { CustomerPasswordReset } from "@/emails/CustomerPasswordReset";
import { ok, badRequest, tooManyRequests, serverError } from "@/lib/utils/apiResponse";

/**
 * POST /api/auth/forgot-password — Body: { email }
 *
 * Mints a password-reset token, stores its SHA-256 hash + a 1-hour
 * expiry on the `users` document, and emails the plaintext token as a
 * link to `/reset-password`. Consumed by `/api/auth/reset-password`.
 *
 * Mirrors the admin reset flow in `/api/admin/users/password`. The
 * response is always a generic success regardless of whether the email
 * is registered — that's what stops this route being an account-
 * enumeration oracle. Unauthenticated by design: the caller is, by
 * definition, locked out.
 */

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// 3 requests / 15 min per IP — enough for a real "I typo'd it" retry,
// stingy enough that it can't be used to spam someone's inbox.
const forgotLimiter = createRateLimiter("customerPasswordReset", {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000,
  failClosed: true,
});

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await forgotLimiter.check(ip);
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

    const parsed = schema.safeParse(body);
    // Generic success even on a malformed email — never confirm or deny
    // that an address is registered.
    if (!parsed.success) {
      return ok({ message: "If that email is registered, a reset link is on its way." });
    }

    const email = parsed.data.email;
    const users = await getUsersCollection();
    const user = await users.findOne({ email });

    if (user) {
      // Plaintext goes in the email; only the hash is stored, so a DB
      // leak doesn't hand out usable reset links.
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            resetToken: tokenHash,
            resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
            updatedAt: new Date(),
          },
        }
      );

      waitUntil(
        (async () => {
          try {
            const result = await sendEmail({
              to: email,
              subject: "Reset your password",
              react: React.createElement(CustomerPasswordReset, {
                name: user.name ?? "there",
                resetToken: token,
              }),
            });
            if (!result.success) {
              logError(result.error, {
                route: "POST /api/auth/forgot-password",
                action: "email_send_failed",
              });
            }
          } catch (emailError) {
            logError(emailError, {
              route: "POST /api/auth/forgot-password",
              action: "email_throw",
            });
          }
        })()
      );
    }

    return ok({
      message: "If that email is registered, a reset link is on its way.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/auth/forgot-password" });
    return serverError();
  }
}
