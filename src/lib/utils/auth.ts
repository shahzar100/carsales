import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";
import { getAdminUsersCollection } from "@/lib/models";
import type { AdminUser } from "@/lib/interfaces";

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
  role?: string;
  // Snapshot of the user's `sessionVersion` at login. If the DB value moves
  // past this (e.g. after a password reset), the session is stale and every
  // authorization check below fails. See getCurrentAdmin.
  sessionVersion?: number;
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
    "⚠️  SESSION_SECRET is not set — using a random per-process fallback. " +
      "Sessions won't survive server restarts. Set SESSION_SECRET in .env.local " +
      "for a stable dev session."
  );
}

// (Day 12 / Fix 12.3) The literal `"dev-only-fallback-secret-at-least-32chars!"`
// was a hardcoded plaintext string in source. Anyone who could read the
// repo could mint a valid dev session cookie. Generate a fresh secret
// at module load instead — opaque to source readers, regenerated every
// `next dev` restart (dev sessions become un-resumable across restarts,
// which is fine: you log in once a session).
const FALLBACK_SECRET = crypto.randomBytes(32).toString("hex");

export const sessionOptions: SessionOptions = {
  password: serverEnv.SESSION_SECRET || FALLBACK_SECRET,
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

/**
 * Resolve the *live* admin user behind the current session, or `null` if the
 * session is no longer valid for any of these reasons:
 *
 *   - not logged in (no cookie / `isLoggedIn !== true`)
 *   - the user row no longer exists  → account was deleted; access is
 *     revoked immediately rather than lingering for the cookie's 24h life
 *   - the stored `sessionVersion` is behind the DB value → the user was
 *     forcibly logged out (e.g. a password reset bumped the epoch)
 *
 * This is the single source of truth for admin authorization. iron-session
 * is a stateless, self-contained encrypted cookie with no server-side store,
 * so trusting `session.role` alone meant a demoted or deleted admin kept
 * their powers until the cookie expired. Reading the row live closes that
 * window: role changes and removals take effect on the very next request.
 *
 * (No request-level memoisation here on purpose — `React.cache` only dedupes
 * inside a render/route scope and silently no-ops elsewhere, so it can't be
 * relied on. The lookup is a single indexed `{ username }` read.)
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getSession();
  if (session.isLoggedIn !== true || !session.username) return null;

  const collection = await getAdminUsersCollection();
  const user = await collection.findOne({ username: session.username });
  if (!user) return null;

  if ((user.sessionVersion ?? 0) !== (session.sessionVersion ?? 0)) {
    return null;
  }
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

/**
 * Returns true if the current session maps to a live user whose *current*
 * role is at least `minRole`. Role hierarchy: staff (1) < manager (2) <
 * admin (3). The role is read live from the DB (via getCurrentAdmin), not
 * from the cookie, so a demotion is enforced on the next request.
 */
export async function hasMinimumRole(minRole: string): Promise<boolean> {
  const user = await getCurrentAdmin();
  if (!user) return false;
  const userLevel = ROLE_HIERARCHY[user.role ?? ""] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return userLevel >= requiredLevel;
}
