import { NextRequest, NextResponse } from "next/server";
import { hasMinimumRole } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { logError } from "@/lib/utils/observability";

/**
 * GET /api/admin/users/lookup?q=<username_or_email>
 * Look up an admin user by username or email.
 * Returns username, email, and role (never the password hash).
 *
 * (Fix 5 / security) Gated to manager+ — the previous
 * `isAuthenticated()` check let any authenticated admin (including the
 * `staff` role) enumerate the entire admin user list one
 * username-guess at a time, which made privilege escalation
 * reconnaissance trivial. The companion write route
 * `src/app/api/admin/users/route.ts` already uses `hasMinimumRole`;
 * this lookup is now consistent with it.
 */
export async function GET(request: NextRequest) {
  try {
    const authorized = await hasMinimumRole("manager");
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const collection = await getAdminUsersCollection();

    // Use collation for case-insensitive exact match — avoids regex injection
    const user = await collection.findOne(
      {
        $or: [{ username: q }, { email: q }],
      },
      { collation: { locale: "en", strength: 2 } }
    );

    if (!user) {
      return NextResponse.json(
        { error: "No user found with that username or email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/users/lookup" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
