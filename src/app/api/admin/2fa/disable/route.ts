import { NextRequest, NextResponse } from "next/server";
import { getAdminUsersCollection } from "@/lib/models";
import { getSession, verifyPassword } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";

// (Fix 4 / security) 5 attempts per 15-minute window per IP. The
// password re-prompt is the load-bearing check on this route — without
// a cap an attacker with a session cookie could brute-force the
// password to flip 2FA off. Matches the verify limiter and the login
// limiter both.
const disableLimiter = createRateLimiter("admin-2fa-disable", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

/**
 * Disable 2FA for the logged-in admin.
 *
 * Requires re-entering the current password — a stolen session cookie
 * alone shouldn't be enough to weaken the user's account.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // (Fix 4 / security) Rate limit before any session / DB work so a
    // capped attacker can't probe response timing.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { allowed, resetIn } = await disableLimiter.check(ip);
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const password = (body as { password?: unknown })?.password;
    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const users = await getAdminUsersCollection();
    const user = await users.findOne({ username: session.username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await users.updateOne(
      { username: session.username },
      {
        $set: { totpEnabled: false, updatedAt: new Date() },
        $unset: { totpSecret: "" },
      }
    );

    await recordAudit({
      actor: session.username,
      action: "admin.2fa_disabled",
      targetType: "user",
      targetId: session.username,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { route: "POST /api/admin/2fa/disable" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
