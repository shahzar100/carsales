import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hashPassword } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { sendEmail } from "@/lib/email/client";

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

// ── Password reset email template ───────────────────────────
function buildReminderEmailHtml(username: string, resetToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/admin/reset-password?token=${resetToken}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" width="100%" style="background-color:#f4f4f4;">
    <tr><td style="padding:40px 20px;">
      <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:40px 30px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">Password Reset Request</h1>
        </td></tr>
        <tr><td style="padding:30px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi <strong>${username}</strong>, a password reset was requested for your admin account.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 25px;">
            Click the button below to set a new password. This link will expire in <strong>24 hours</strong>.
          </p>
          <table role="presentation" width="100%"><tr><td style="text-align:center;">
            <a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
              Reset Password
            </a>
          </td></tr></table>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:25px 0 0;">
            If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color:#2563eb;word-break:break-all;">${resetLink}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
      html: buildReminderEmailHtml(username, resetToken),
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
