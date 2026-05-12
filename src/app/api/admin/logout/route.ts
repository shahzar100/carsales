import { NextResponse } from "next/server";
import { getSession } from "@/lib/utils/auth";

export async function POST() {
  try {
    const session = await getSession();
    // session.destroy() returns a Promise that re-encrypts/clears the cookie.
    // Without await, NextResponse may be returned before Set-Cookie is finalised
    // and the old cookie persists in the browser. (CODEBASE_ISSUES A4.)
    await session.destroy();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
