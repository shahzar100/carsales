import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hashPassword } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";

/**
 * Generate a cryptographically strong random password.
 * Format: 4 mixed chars + dash + 4 mixed chars + dash + 4 mixed chars (16 chars total)
 * Guarantees at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character.
 */
function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";

  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

  // Guarantee at least one of each category
  const guaranteed = [pick(upper), pick(lower), pick(digits), pick(special)];

  // Fill the rest from the full pool
  const pool = upper + lower + digits + special;
  const remaining = Array.from({ length: 12 }, () => pick(pool));

  // Shuffle all characters together
  const all = [...guaranteed, ...remaining];
  for (let i = all.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  // Format as xxxx-xxxx-xxxx-xxxx for readability
  const raw = all.join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

const validRoles = ["staff", "manager", "admin"] as const;

export async function POST(request: NextRequest) {
  try {
    const { username, email, role } = await request.json();

    // ── Validation ──────────────────────────────────────────
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be at least 3 characters and contain only letters, numbers, and underscores",
        },
        { status: 400 }
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be one of: staff, manager, admin" },
        { status: 400 }
      );
    }

    const adminCollection = await getAdminUsersCollection();

    // Check for duplicate username or email
    const existing = await adminCollection.findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.username === username
              ? "A user with that username already exists"
              : "A user with that email already exists",
        },
        { status: 409 }
      );
    }

    // ── Generate password & hash with bcrypt ────────────────
    const plainPassword = generateStrongPassword();
    const passwordHash = await hashPassword(plainPassword);

    // ── Insert into MongoDB ─────────────────────────────────
    await adminCollection.insertOne({
      username,
      email,
      passwordHash,
      role: role as (typeof validRoles)[number],
      createdAt: new Date(),
    });

    // Return the plain-text password ONCE so the admin can hand it off
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      password: plainPassword,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
