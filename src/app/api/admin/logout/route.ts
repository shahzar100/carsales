import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    session.destroy();

    return NextResponse.json({ 
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    return NextResponse.json({ 
      isLoggedIn: session.isLoggedIn || false,
      username: session.username
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { isLoggedIn: false },
      { status: 500 }
    );
  }
}
