import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyPassword } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";

// 5 login attempts per 15-minute window per IP
const loginLimiter = createRateLimiter("login", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { allowed, remaining, resetIn } = loginLimiter.check(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

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
    session.role = admin.role as string | undefined;
    await session.save();

    // Reset rate limiter on successful login
    loginLimiter.reset(ip);

    return NextResponse.json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
