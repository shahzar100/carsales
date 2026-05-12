import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import crypto from "crypto";
import {
  getSession,
  hashPassword,
  hasMinimumRole,
  isAuthenticated,
} from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { sendEmail } from "@/emails/send";
import React from "react";
import { PasswordReset } from "@/emails/PasswordReset";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError, logEvent } from "@/lib/utils/observability";

// Defensive ceiling against an authenticated-but-malicious account.
// 10 actions per IP per hour is plenty for legitimate admin use.
// (CODEBASE_ISSUES A13.)
const passwordActionLimiter = createRateLimiter("admin-password-action", {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
});

// ── Password generator (same algo as user creation) ─────────
function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";

  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

  const guaranteed = [pick(upper), pick(lower), pick(digits), pick(special)];
  const pool = upper + lower + digits + special;
  const remaining = Array.from({ length: 12 }, () => pick(pool));

  const all = [...guaranteed, ...remaining];
  for (let i = all.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  const raw = all.join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

/**
 * POST /api/admin/users/password
 * Body: { action: "reset" | "reminder", username: string }
 *
 * reset    → generates a new password, hashes + stores it, returns plain text
 *            ⚠️ TODO(security): the plaintext-in-response pattern is a known
 *            risk — it lands in browser memory, BFCache, and any forward
 *            proxy. The fix is a proper email-link reset flow with a
 *            single-use token (the `reminder` action below is the half-built
 *            framework for it). Tracked as CODEBASE_ISSUES A2.
 * reminder → generates a reset token, stores it, emails a reset link
 *            ⚠️ TODO(feature): the email links to `/admin/reset-password`
 *            but neither the page nor the consuming API route exists yet.
 *            Until it's built, this action is effectively dead code.
 *            Tracked as CODEBASE_ISSUES A7.
 *
 * Authorization (CODEBASE_ISSUES A1):
 *   - Caller must be at least `admin` for password resets affecting any user.
 *     Previously this only required `isAuthenticated`, which let a compromised
 *     `staff` account reset the `admin` user's password and receive the
 *     plaintext.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth gate ──────────────────────────────────────────
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Resetting a password is admin-only. Manager/staff cannot escalate via
    // this route. (CODEBASE_ISSUES A1.)
    const isAdmin = await hasMinimumRole("admin");
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden — admin role required" },
        { status: 403 }
      );
    }

    // ── Rate limit (per-IP) ────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
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

    // ── Reset Password ──────────────────────────────────────
    if (action === "reset") {
      const plainPassword = generateStrongPassword();
      const passwordHash = await hashPassword(plainPassword);

      await collection.updateOne(
        { username },
        {
          $set: { passwordHash, updatedAt: new Date() },
          $unset: { resetToken: "", resetTokenExpiry: "" },
        }
      );

      // Audit trail. Logs *who* reset *whom*, never the plaintext.
      const session = await getSession();
      logEvent("admin.password.reset", {
        actor: session.username,
        target: username,
      });

      return NextResponse.json({
        success: true,
        message: "Password has been reset",
        // ⚠️ See TODO(security) above. Returned to support the existing
        // admin UX where the actor copies the new password and hands it
        // to the user. Replace with email-link flow.
        password: plainPassword,
      });
    }

    // ── Password Reminder (email reset link) ────────────────
    if (!user || !user.email) {
      return NextResponse.json(
        {
          error:
            "This user has no email address on file. A password reminder cannot be sent.",
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
    logEvent("admin.password.reminder_sent", {
      actor: session.username,
      target: username,
    });

    return NextResponse.json({
      success: true,
      message: "Password reminder email sent",
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
