import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";

/**
 * GET /api/admin/users/lookup?q=<username_or_email>
 * Look up an admin user by username or email.
 * Returns username, email, and role (never the password hash).
 */
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("User lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
