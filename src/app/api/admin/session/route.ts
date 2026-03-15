import { NextResponse } from "next/server";
import { getSession } from "@/lib/utils/auth";

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn || false,
      ...(session.isLoggedIn && { username: session.username }),
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ isLoggedIn: false }, { status: 500 });
  }
}
