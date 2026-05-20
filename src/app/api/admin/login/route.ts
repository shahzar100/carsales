import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { getSession, verifyPassword } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import { verifyTotpCode } from "@/lib/utils/twoFactor";

// 5 login attempts per 15-minute window per IP. Backed by Vercel KV in
// production (see rateLimit.ts) so the counter is shared across all warm
// Lambdas; falls back to per-instance memory when KV_REST_API_URL is unset.
const loginLimiter = createRateLimiter("login", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  failClosed: true,
});

/**
 * Constant-time guard against username enumeration.
 *
 * Pre-computed bcrypt (cost 12) of "this-is-not-a-real-password".
 * verifyPassword runs against this when the user doesn't exist, so the
 * response time matches a real failed login. The hash rejects any real
 * input password by construction. (CODEBASE_ISSUES A8.)
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$pDBDseLO5CRDEGLX70WZHutBFb6ujNeagUc/ONCxc/fWbmAUG46i6";

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────
    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await loginLimiter.check(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // ── Parse + type-guard the body ────────────────────────
    // Without this, a JSON body of {"username": {"$gt": ""}} would forge a
    // Mongo operator filter and match the first user in the collection.
    // (CODEBASE_ISSUES A5.)
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      typeof (body as { username?: unknown }).username !== "string" ||
      typeof (body as { password?: unknown }).password !== "string"
    ) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const username = (body as { username: string }).username.trim();
    const password = (body as { password: string }).password;
    const totpCode = (body as { totpCode?: unknown }).totpCode;

    if (
      username.length === 0 ||
      username.length > 64 ||
      password.length === 0 ||
      password.length > 200
    ) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const adminCollection = await getAdminUsersCollection();
    const admin = await adminCollection.findOne({ username });

    // Constant-time path: always run verifyPassword exactly once, regardless of
    // whether the user exists. (CODEBASE_ISSUES A8.)
    const passwordHash = admin?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const isValid = await verifyPassword(password, passwordHash);

    if (!admin || !isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ── 2FA challenge (Day 12.2) ────────────────────────────
    // If the user has opted into 2FA, the first POST returns a 200 with
    // `requires2fa: true` and no session is set. The client re-POSTs with
    // `username`, `password`, and the 6-digit `totpCode`. We re-verify
    // the password on the second request rather than holding partial-auth
    // state server-side.
    if (admin.totpEnabled && admin.totpSecret) {
      if (typeof totpCode !== "string") {
        return NextResponse.json({ success: false, requires2fa: true });
      }
      if (!verifyTotpCode(admin.totpSecret, totpCode)) {
        return NextResponse.json(
          { error: "Invalid 2FA code", requires2fa: true },
          { status: 401 }
        );
      }
    }

    // Update last login (fire-and-forget; not blocking on this is fine).
    await adminCollection.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    // Set session
    const session = await getSession();
    session.isLoggedIn = true;
    session.username = admin.username;
    session.role = admin.role as string | undefined;
    await session.save();

    // Note: deliberately NOT calling loginLimiter.reset(ip). Resetting on
    // success lets a successful guess from a credential dump grant unlimited
    // fresh attempts. (CODEBASE_ISSUES A6.)

    return NextResponse.json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    logError(error, { route: "POST /api/admin/login" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
