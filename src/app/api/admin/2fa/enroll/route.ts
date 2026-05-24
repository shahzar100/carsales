import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { getAdminUsersCollection } from "@/lib/models";
import { getSession } from "@/lib/utils/auth";
import { generateTotpEnrolment } from "@/lib/utils/twoFactor";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";

// Mirror the verify / disable limiters (5 per 15 min, fail-closed). The
// enroll endpoint mints a fresh TOTP secret and stashes it on the
// session — a hijacked session that can spam this could be used to
// hammer the DB and rotate session state. failClosed because the
// enroll → verify chain is a credential-grade flow.
const enrollLimiter = createRateLimiter("admin-2fa-enroll", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  failClosed: true,
});

/**
 * Begin 2FA enrolment for the logged-in admin.
 *
 * Generates a fresh TOTP secret + otpauth URI and returns them. The secret
 * is NOT persisted until the user submits a valid verification code via
 * `/api/admin/2fa/verify`. That prevents an enrol-and-walk-away from
 * locking the account into a secret the user doesn't actually hold.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await enrollLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const session = await getSession();
    if (!session.isLoggedIn || !session.username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const users = await getAdminUsersCollection();
    const user = await users.findOne({ username: session.username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.totpEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled. Disable it first to re-enrol." },
        { status: 409 }
      );
    }

    const { secret, uri } = generateTotpEnrolment(
      `${user.username}@morleymotorcompany`
    );

    // The pending secret lives on the session, not the user document, until
    // the user proves possession by submitting a valid code.
    (session as unknown as { pendingTotpSecret?: string }).pendingTotpSecret =
      secret;
    await session.save();

    return NextResponse.json({ secret, uri });
  } catch (error) {
    logError(error, { route: "POST /api/admin/2fa/enroll" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
