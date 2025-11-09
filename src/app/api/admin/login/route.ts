import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyPassword } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const adminCollection = await getAdminUsersCollection();
    const admin = await adminCollection.findOne({ username });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, admin.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login
    await adminCollection.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    // Set session
    const session = await getSession();
    session.isLoggedIn = true;
    session.username = admin.username;
    await session.save();

    return NextResponse.json({ 
      success: true,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
