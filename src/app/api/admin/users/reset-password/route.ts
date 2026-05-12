import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hashPassword } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError, logEvent } from "@/lib/utils/observability";
import { recordAudit } from "@/lib/utils/audit";

const consumeLimiter = createRateLimiter("password-reset-consume", {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000,
});

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 200;

function isValidPassword(pw: string): boolean {
  if (pw.length < PASSWORD_MIN || pw.length > PASSWORD_MAX) return false;
  return /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
}

/**
 * POST /api/admin/users/reset-password
 * Body: { token: string, newPassword: string }
 *
 * Consumer side of the email-link reset flow. The reminder action in
 * `/api/admin/users/password` mints a token, stores its SHA-256 hash, and
 * emails the plaintext to the user. This route accepts that plaintext back,
 * hashes it again, looks up the matching unexpired row, and sets the new
 * password — atomically clearing the token in the same write so it can't
 * be replayed.
 *
 * Unauthenticated by design (the caller is, by definition, locked out).
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { allowed, resetIn } = await consumeLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const token = (body as { token?: unknown })?.token;
    const newPassword = (body as { newPassword?: unknown })?.newPassword;

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }
    if (typeof newPassword !== "string" || !isValidPassword(newPassword)) {
      return NextResponse.json(
        {
          error:
            "Password must be 12–200 characters and include uppercase, lowercase, and a digit",
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const collection = await getAdminUsersCollection();
    const user = await collection.findOne({
      resetToken: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await collection.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash, updatedAt: new Date() },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      }
    );

    logEvent("admin.password.reset_consumed", { target: user.username });
    await recordAudit({
      actor: user.username,
      action: "user.password_reset_consumed",
      targetType: "user",
      metadata: { target: user.username },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated. You can now sign in.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/admin/users/reset-password" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
