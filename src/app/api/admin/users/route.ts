import { NextRequest, NextResponse } from "next/server";
import { ipAddress, waitUntil } from "@vercel/functions";
import crypto from "crypto";
import React from "react";
import { getSession, hashPassword, hasMinimumRole } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import { getAdminUsersCollection } from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { sendEmail } from "@/emails/send";
import { PasswordReset } from "@/emails/PasswordReset";
import { logError, logEvent } from "@/lib/utils/observability";

// 10 user-creation attempts per hour per IP
const userCreateLimiter = createRateLimiter("admin-user-create", {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
});

const validRoles = ["staff", "manager", "admin"] as const;

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────
    const ip = ipAddress(request) || "unknown";
    const { allowed, remaining, resetIn } = await userCreateLimiter.check(ip);
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

    // ── Role check: manager or admin only ──────────────────
    const authorized = await hasMinimumRole("manager");
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    void remaining; // consumed for rate-limit header only

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    const { username, email, role } = body as {
      username?: string;
      email?: string;
      role?: string;
    };

    // ── Validation ──────────────────────────────────────────
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be at least 3 characters and contain only letters, numbers, and underscores",
        },
        { status: 400 }
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    // Cast to widen for `.includes` — `validRoles` is `as const` so its
    // element type is the union, but `role` is a free string at this point.
    if (!role || !(validRoles as readonly string[]).includes(role)) {
      return NextResponse.json(
        { error: "Role must be one of: staff, manager, admin" },
        { status: 400 }
      );
    }

    // Prevent privilege escalation: a caller may not create an account with a
    // role higher than their own. This route is manager+, so without this a
    // manager could mint an `admin` pointed at an address they control and
    // consume the setup link to obtain full admin. (Audit: role ceiling.)
    const ROLE_LEVEL = { staff: 1, manager: 2, admin: 3 } as const;
    const session = await getSession();
    const callerLevel =
      ROLE_LEVEL[(session.role ?? "staff") as keyof typeof ROLE_LEVEL] ?? 0;
    const requestedLevel = ROLE_LEVEL[role as keyof typeof ROLE_LEVEL];
    if (requestedLevel > callerLevel) {
      return NextResponse.json(
        { error: "You cannot create a user with a role higher than your own" },
        { status: 403 }
      );
    }

    const adminCollection = await getAdminUsersCollection();

    const existing = await adminCollection.findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.username === username
              ? "A user with that username already exists"
              : "A user with that email already exists",
        },
        { status: 409 }
      );
    }

    // The new user receives a setup link, not a plaintext password. We seed
    // the row with an unguessable hash that will never match a real
    // bcrypt.compare, so the account is unlogin-able until the reset link
    // is consumed. (WEBSITE_REVIEW #11 / DAY_PLAN Fix 2.3.)
    const placeholderHash = await hashPassword(
      crypto.randomBytes(32).toString("hex")
    );

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await adminCollection.insertOne({
      username,
      email,
      passwordHash: placeholderHash,
      role: role as (typeof validRoles)[number],
      resetToken: resetTokenHash,
      resetTokenExpiry,
      createdAt: new Date(),
    });

    waitUntil(
      (async () => {
        try {
          const emailResult = await sendEmail({
            to: email,
            subject: "Set up your admin account",
            react: React.createElement(PasswordReset, { username, resetToken }),
          });
          if (!emailResult.success) {
            logError(emailResult.error, {
              route: "POST /api/admin/users",
              action: "setup.email_send_failed",
              username,
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/admin/users",
            action: "setup.email_throw",
            username,
          });
        }
      })()
    );

    logEvent("admin.user.created", { target: username });
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "user.create",
      targetType: "user",
      metadata: { target: username, role },
    });

    return NextResponse.json({
      success: true,
      message: "User created. Setup email sent.",
      emailSent: true,
    });
  } catch (error) {
    logError(error, { route: "POST /api/admin/users" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
