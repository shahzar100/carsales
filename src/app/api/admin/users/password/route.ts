import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import crypto from "crypto";
import { hashPassword, isAuthenticated } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { sendEmail } from "@/emails/send";
import React from "react";
import { PasswordReset } from "@/emails/PasswordReset";

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
 * reminder → generates a reset token, stores it, emails a reset link
 */
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, username } = await request.json();

    // ── Validation ──────────────────────────────────────────
    if (!action || !["reset", "reminder"].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "reset" or "reminder"' },
        { status: 400 }
      );
    }

    if (!username || typeof username !== "string") {
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

      return NextResponse.json({
        success: true,
        message: "Password has been reset",
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
            console.warn(
              "⚠️ Password reset email failed to send:",
              emailResult.error
            );
          }
        } catch (emailError) {
          console.error("Error sending password reset email:", emailError);
        }
      })()
    );

    return NextResponse.json({
      success: true,
      message: "Password reminder email sent",
      emailSent: true,
    });
  } catch (error) {
    console.error("Password action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
