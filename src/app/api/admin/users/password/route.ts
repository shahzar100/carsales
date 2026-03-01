import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hashPassword } from "@/lib/utils/auth";
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    if (!user.email) {
      return NextResponse.json(
        {
          error:
            "This user has no email address on file. A password reminder cannot be sent.",
        },
        { status: 400 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

    await collection.updateOne(
      { username },
      { $set: { resetToken, resetTokenExpiry, updatedAt: new Date() } }
    );

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Password Reset — Admin Panel",
      react: React.createElement(PasswordReset, { username, resetToken }),
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

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
