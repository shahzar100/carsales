import { NextResponse } from "next/server";
import { getAdminUsersCollection } from "@/lib/models";
import { getSession } from "@/lib/utils/auth";
import { generateTotpEnrolment } from "@/lib/utils/twoFactor";
import { logError } from "@/lib/utils/observability";

/**
 * Begin 2FA enrolment for the logged-in admin.
 *
 * Generates a fresh TOTP secret + otpauth URI and returns them. The secret
 * is NOT persisted until the user submits a valid verification code via
 * `/api/admin/2fa/verify`. That prevents an enrol-and-walk-away from
 * locking the account into a secret the user doesn't actually hold.
 */
export async function POST(): Promise<NextResponse> {
  try {
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
