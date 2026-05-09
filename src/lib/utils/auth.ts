import bcrypt from "bcryptjs";
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
  role?: string;
}

const ROLE_HIERARCHY: Record<string, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
};

// `serverEnv` enforces the production-vs-dev SESSION_SECRET contract
// (see src/lib/env.ts: throws if SESSION_SECRET is missing in production).
// In development we still want a friendly warning when running without one.
if (!serverEnv.SESSION_SECRET) {
  console.warn(
    "⚠️  SESSION_SECRET is not set — using fallback. Set it for all environments!"
  );
}

export const sessionOptions: SessionOptions = {
  password:
    serverEnv.SESSION_SECRET || "dev-only-fallback-secret-at-least-32chars!",
  cookieName: "carsales_admin_session",
  cookieOptions: {
    secure: serverEnv.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}

/**
 * Returns true if the current session has at least the given role level.
 * Role hierarchy: staff (1) < manager (2) < admin (3)
 */
export async function hasMinimumRole(minRole: string): Promise<boolean> {
  const session = await getSession();
  if (!session.isLoggedIn) return false;
  const userLevel = ROLE_HIERARCHY[session.role ?? ""] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return userLevel >= requiredLevel;
}
