import "server-only";
import crypto from "crypto";
import React from "react";

import { getUsersCollection } from "@/lib/models";
import { sendEmail } from "@/emails/send";
import { VerifyEmail } from "@/emails/VerifyEmail";
import { logError } from "@/lib/utils/observability";

/**
 * Email-verification helper, shared by the sign-up route and the resend
 * endpoint.
 *
 * Mints a one-time token, stores only its SHA-256 hash + a 24h expiry on
 * the user document (so a DB leak doesn't hand out usable links), and
 * emails the plaintext token as a link to `/api/auth/verify-email`.
 *
 * No-ops when the user doesn't exist or is already verified — callers
 * can fire it unconditionally without first checking.
 */

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function hashVerifyToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail(email: string): Promise<void> {
  const users = await getUsersCollection();
  const user = await users.findOne({ email });
  if (!user || user.emailVerified) return;

  const token = crypto.randomBytes(32).toString("hex");
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        verifyToken: hashVerifyToken(token),
        verifyTokenExpiry: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
        updatedAt: new Date(),
      },
    }
  );

  const result = await sendEmail({
    to: email,
    subject: "Confirm your email address",
    react: React.createElement(VerifyEmail, {
      name: user.name ?? "there",
      verifyToken: token,
    }),
  });

  if (!result.success) {
    logError(result.error, {
      route: "sendVerificationEmail",
      action: "email_send_failed",
    });
  }
}
