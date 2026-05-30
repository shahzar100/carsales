import { NextRequest, NextResponse } from "next/server";
import { ipAddress, waitUntil } from "@vercel/functions";
import crypto from "crypto";
import {
  getSession,
  hasMinimumRole,
  isAuthenticated,
} from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { sendEmail } from "@/emails/send";
import React from "react";
import { PasswordReset } from "@/emails/PasswordReset";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError, logEvent } from "@/lib/utils/observability";
import { recordAudit } from "@/lib/utils/audit";

// Defensive ceiling against an authenticated-but-malicious account.
// 10 actions per IP per hour is plenty for legitimate admin use.
const passwordActionLimiter = createRateLimiter("admin-password-action", {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  failClosed: true,
});

/**
 * POST /api/admin/users/password
 * Body: { action: "reset" | "reminder", username: string }
 *
 * Both actions mint a reset token, store its SHA-256 hash with a 1-hour
 * expiry, and email the plaintext token to the user. The consumer is
 * `/api/admin/users/reset-password` (Fix 2.1). Neither action returns the
 * plaintext token or any plaintext password in the response — the email
 * is the only channel that ever sees the secret. (Fix 2.3.)
 *
 * reset    → admin-acting-on-user: 404 if the user doesn't exist.
 * reminder → user-self-requesting: returns generic success either way to
 *            prevent username enumeration.
 *
 * Authorization:
 *   - Caller must be at least `admin`. Previously only required
 *     `isAuthenticated`, which let a compromised `staff` account reset
 *     the `admin` user's password.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth gate ──────────────────────────────────────────
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Resetting a password is admin-only. Manager/staff cannot escalate via
    // this route.
    const isAdmin = await hasMinimumRole("admin");
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden — admin role required" },
        { status: 403 }
      );
    }

    // ── Rate limit (per-IP) ────────────────────────────────
    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await passwordActionLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many password actions. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
        }
      );
    }

    // ── Parse + type-guard the body ────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const action = (body as { action?: unknown })?.action;
    const username = (body as { username?: unknown })?.username;

    if (action !== "reset" && action !== "reminder") {
      return NextResponse.json(
        { error: 'Action must be "reset" or "reminder"' },
        { status: 400 }
      );
    }
    if (typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const collection = await getAdminUsersCollection();
    const user = await collection.findOne({ username });

    // For "reset" action, we need to confirm user exists (admin-only route)
    if (!user && action === "reset") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For "reminder" action, return generic success to prevent user enumeration
    if (!user && action === "reminder") {
      return NextResponse.json({
        success: true,
        message:
          "If an account with that username exists, a password reminder email has been sent",
        emailSent: true,
      });
    }

    if (!user || !user.email) {
      return NextResponse.json(
        {
          error:
            "This user has no email address on file. A password reset cannot be sent.",
        },
        { status: 400 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store a SHA-256 hash of the token — never store plaintext tokens
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await collection.updateOne(
      { username },
      {
        $set: {
          resetToken: resetTokenHash,
          resetTokenExpiry,
          updatedAt: new Date(),
        },
      }
    );

    // Send reset email in the background — token is already saved in DB
    waitUntil(
      (async () => {
        try {
          const emailResult = await sendEmail({
            to: user.email,
            subject: "Password Reset — Admin Panel",
            react: React.createElement(PasswordReset, { username, resetToken }),
          });

          if (!emailResult.success) {
            logError(emailResult.error, {
              route: "POST /api/admin/users/password",
              action: "reminder.email_send_failed",
              username,
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/admin/users/password",
            action: "reminder.email_throw",
            username,
          });
        }
      })()
    );

    const session = await getSession();
    logEvent(
      action === "reset"
        ? "admin.password.reset_sent"
        : "admin.password.reminder_sent",
      { actor: session.username, target: username }
    );
    await recordAudit({
      actor: session.username ?? "unknown",
      action:
        action === "reset"
          ? "user.password_reset_sent"
          : "user.password_reminder_sent",
      targetType: "user",
      metadata: { target: username },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "reset"
          ? "Password reset email sent"
          : "Password reminder email sent",
      emailSent: true,
    });
  } catch (error) {
    logError(error, { route: "POST /api/admin/users/password" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
