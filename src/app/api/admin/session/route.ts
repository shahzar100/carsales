import { NextResponse } from "next/server";
import { getSession } from "@/lib/utils/auth";
import { logError } from "@/lib/utils/observability";

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn || false,
      ...(session.isLoggedIn && { username: session.username }),
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/session" });
    return NextResponse.json({ isLoggedIn: false }, { status: 500 });
  }
}
