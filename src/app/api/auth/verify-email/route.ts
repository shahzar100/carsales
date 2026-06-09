import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getUsersCollection } from "@/lib/models";
import { hashVerifyToken, sendVerificationEmail } from "@/lib/utils/emailVerification";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import { ok, unauthorized, tooManyRequests, serverError } from "@/lib/utils/apiResponse";

/**
 * GET  /api/auth/verify-email?token=… — consume an email-verification
 *      link. Stamps `emailVerified` and clears the token, then redirects
 *      to /account with a `?verified` flag the dashboard reads. Invalid
 *      or expired tokens redirect with `?verified=expired`.
 *
 * POST /api/auth/verify-email — resend the verification email to the
 *      signed-in customer. Rate-limited per account.
 *
 * Verification is "soft": an unverified customer can still sign in and
 * use the site — the dashboard just nudges them with a banner. This is
 * the consumer side of `sendVerificationEmail()`.
 */

const resendLimiter = createRateLimiter("customerVerifyResend", {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000,
});

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token") ?? "";
    const redirect = (status: string) =>
      NextResponse.redirect(
        new URL(`/account?verified=${status}`, request.url)
      );

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return redirect("expired");
    }

    const users = await getUsersCollection();
    const user = await users.findOne({
      verifyToken: hashVerifyToken(token),
      verifyTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return redirect("expired");
    }

    await users.updateOne(
      { _id: user._id },
      {
        $set: { emailVerified: new Date(), updatedAt: new Date() },
        $unset: { verifyToken: "", verifyTokenExpiry: "" },
      }
    );

    return redirect("1");
  } catch (error) {
    logError(error, { route: "GET /api/auth/verify-email" });
    return serverError();
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return unauthorized("You must be signed in");

    // Key by the authenticated account, not the IP — the resend is a
    // per-account action, and an IP key would let a NAT/CGNAT cohort
    // throttle each other while a single attacker rotating accounts
    // behind one IP stays under the cap. Mirrors the magic-link limiter
    // in src/auth.ts, which is keyed by recipient.
    const { allowed, resetIn } = await resendLimiter.check(
      email.toLowerCase()
    );
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const users = await getUsersCollection();
    const user = await users.findOne(
      { email },
      { projection: { emailVerified: 1 } }
    );
    if (user?.emailVerified) {
      return ok({ message: "Your email is already verified.", verified: true });
    }

    // No-ops cleanly if the user is missing or already verified.
    await sendVerificationEmail(email);

    return ok({
      message: "Verification email sent. Check your inbox.",
      verified: false,
    });
  } catch (error) {
    logError(error, { route: "POST /api/auth/verify-email" });
    return serverError();
  }
}
