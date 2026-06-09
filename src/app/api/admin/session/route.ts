import { NextResponse } from "next/server";
import { getSession } from "@/lib/utils/auth";
import { logError } from "@/lib/utils/observability";

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn || false,
      // `role` lets the client nav show role-appropriate tabs (e.g. the
      // Users & Access page is manager+). Authorization is still enforced
      // server-side on every page and API route — this is display only.
      ...(session.isLoggedIn && {
        username: session.username,
        role: session.role,
      }),
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/session" });
    return NextResponse.json({ isLoggedIn: false }, { status: 500 });
  }
}
