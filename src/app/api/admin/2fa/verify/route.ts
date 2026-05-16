import { NextRequest, NextResponse } from "next/server";
import { getAdminUsersCollection } from "@/lib/models";
import { getSession } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import { verifyTotpCode } from "@/lib/utils/twoFactor";
import { logError } from "@/lib/utils/observability";

/**
 * Finalise 2FA enrolment.
 *
 * Reads the pending secret from the session, verifies the submitted code,
 * and on success persists `totpSecret` + `totpEnabled: true` on the user
 * document. The session's `pendingTotpSecret` is cleared either way.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const pending = (session as unknown as { pendingTotpSecret?: string })
      .pendingTotpSecret;
    if (!pending) {
      return NextResponse.json(
        { error: "No pending enrolment. Start with /api/admin/2fa/enroll." },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const code = (body as { code?: unknown })?.code;
    if (typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (!verifyTotpCode(pending, code)) {
      return NextResponse.json(
        { error: "Invalid code. Try again." },
        { status: 401 }
      );
    }

    const users = await getAdminUsersCollection();

    // Refuse to overwrite a secret that's already in place. Without this
    // guard a stolen session cookie could call /enroll → /verify and
    // silently rotate the legitimate user's TOTP seed to one the attacker
    // controls, locking the real user out without ever touching the
    // password. The disable flow (which re-prompts for the password) is
    // the only path that should clear the existing secret.
    const existing = await users.findOne({ username: session.username });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (existing.totpEnabled === true) {
      return NextResponse.json(
        { error: "2FA already enabled — disable first to re-enrol" },
        { status: 409 }
      );
    }

    const result = await users.updateOne(
      { username: session.username },
      { $set: { totpSecret: pending, totpEnabled: true, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    delete (session as unknown as { pendingTotpSecret?: string })
      .pendingTotpSecret;
    await session.save();

    await recordAudit({
      actor: session.username,
      action: "admin.2fa_enabled",
      targetType: "user",
      targetId: session.username,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { route: "POST /api/admin/2fa/verify" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
