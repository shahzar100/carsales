import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { ObjectId } from "mongodb";
import { getSession, hasMinimumRole } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { recordAudit } from "@/lib/utils/audit";
import { logError, logEvent } from "@/lib/utils/observability";

const ROLE_LEVEL = { staff: 1, manager: 2, admin: 3 } as const;
type Role = keyof typeof ROLE_LEVEL;
const validRoles = ["staff", "manager", "admin"] as const;

// Privileged, low-volume operations — a tight per-IP ceiling. `failClosed`
// so a KV outage can't open an unlimited window on role changes / deletions
// (same posture as the password-action limiter).
const mutateLimiter = createRateLimiter("admin-user-mutate", {
  maxRequests: 30,
  windowMs: 60 * 60 * 1000,
  failClosed: true,
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/users/[id] — change a user's access level.
 * Body: { role: "staff" | "manager" | "admin" }
 *
 * Admin-only. Changing privilege levels is the most sensitive user operation,
 * so it sits a tier above the manager-gated create route. Three guards keep an
 * admin from foot-gunning the whole dashboard into an unmanageable state:
 *
 *   1. Self           — you can't change your own level (avoids accidental
 *                       self-demotion and the last-admin race for the caller).
 *   2. Role ceiling   — you can't grant a role above your own (a no-op while
 *                       this is admin-only, but it holds the invariant if the
 *                       gate is ever lowered to manager).
 *   3. Last admin     — you can't strip the final admin of admin rights, or
 *                       nobody could manage users again.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await hasMinimumRole("admin"))) {
      return NextResponse.json(
        { error: "Forbidden — admin role required" },
        { status: 403 }
      );
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await mutateLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
        }
      );
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const role = (body as { role?: unknown })?.role;
    if (
      typeof role !== "string" ||
      !(validRoles as readonly string[]).includes(role)
    ) {
      return NextResponse.json(
        { error: "Role must be one of: staff, manager, admin" },
        { status: 400 }
      );
    }

    const collection = await getAdminUsersCollection();
    const target = await collection.findOne({
      _id: new ObjectId(id) as never,
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const session = await getSession();

    // Guard 1: self
    if (session.username && target.username === session.username) {
      return NextResponse.json(
        { error: "You cannot change your own access level" },
        { status: 400 }
      );
    }

    // Guard 2: role ceiling
    const callerLevel = ROLE_LEVEL[(session.role ?? "staff") as Role] ?? 0;
    if (ROLE_LEVEL[role as Role] > callerLevel) {
      return NextResponse.json(
        { error: "You cannot grant a role higher than your own" },
        { status: 403 }
      );
    }

    if (target.role === role) {
      return NextResponse.json({
        success: true,
        message: "No change — user already has that role.",
      });
    }

    // Guard 3 (fast path): never strip the last admin.
    const demotingAdmin = target.role === "admin" && role !== "admin";
    if (demotingAdmin) {
      const adminCount = await collection.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot change the role of the last admin. Promote another user to admin first.",
          },
          { status: 409 }
        );
      }
    }

    await collection.updateOne(
      { _id: target._id },
      { $set: { role: role as Role, updatedAt: new Date() } }
    );

    // Guard 3 (self-heal): the count-then-write above is not atomic, so two
    // admins demoting each other at the same instant could both clear the
    // fast-path check and leave zero admins. Re-verify after the write and
    // roll the role back if we just removed the final admin. Worst case this
    // over-restores (both come back) — always preferable to an unrecoverable
    // zero-admin lockout of the whole user-management surface.
    if (
      demotingAdmin &&
      (await collection.countDocuments({ role: "admin" })) === 0
    ) {
      await collection.updateOne(
        { _id: target._id },
        { $set: { role: "admin", updatedAt: new Date() } }
      );
      return NextResponse.json(
        {
          error:
            "Cannot change the role of the last admin. Promote another user to admin first.",
        },
        { status: 409 }
      );
    }

    logEvent("admin.user.role_changed", {
      target: target.username,
      from: target.role,
      to: role,
    });
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "user.role_change",
      targetType: "user",
      metadata: { target: target.username, from: target.role, to: role },
    });

    return NextResponse.json({
      success: true,
      message: `Access level updated to ${role}.`,
    });
  } catch (error) {
    logError(error, { route: "PATCH /api/admin/users/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id] — remove an admin account.
 *
 * Admin-only, with the same self and last-admin guards as PATCH: you can't
 * delete your own account, and you can't delete the final admin.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    if (!(await hasMinimumRole("admin"))) {
      return NextResponse.json(
        { error: "Forbidden — admin role required" },
        { status: 403 }
      );
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await mutateLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
        }
      );
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const collection = await getAdminUsersCollection();
    const target = await collection.findOne({
      _id: new ObjectId(id) as never,
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const session = await getSession();

    if (session.username && target.username === session.username) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    if (target.role === "admin") {
      const adminCount = await collection.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot delete the last admin. Promote another user to admin first.",
          },
          { status: 409 }
        );
      }
    }

    await collection.deleteOne({ _id: target._id });

    // Self-heal the non-atomic last-admin check (see PATCH): if two admins
    // delete each other simultaneously the fast-path count can pass for both.
    // If the deletion just emptied the admin tier, re-insert the row we
    // removed to restore the invariant.
    if (
      target.role === "admin" &&
      (await collection.countDocuments({ role: "admin" })) === 0
    ) {
      await collection.insertOne(target);
      return NextResponse.json(
        {
          error:
            "Cannot delete the last admin. Promote another user to admin first.",
        },
        { status: 409 }
      );
    }

    logEvent("admin.user.deleted", { target: target.username });
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "user.delete",
      targetType: "user",
      metadata: { target: target.username, role: target.role },
    });

    return NextResponse.json({
      success: true,
      message: "User removed.",
    });
  } catch (error) {
    logError(error, { route: "DELETE /api/admin/users/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
