import NextAuth, { CredentialsSignin } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import clientPromise from "@/lib/mongodb";
import { getUsersCollection } from "@/lib/models";
import { verifyPassword } from "@/lib/utils/auth";
import { createRateLimiter } from "@/lib/utils/rateLimit";

/**
 * Customer-facing authentication (Auth.js / NextAuth v5).
 *
 * This is entirely separate from the admin auth in
 * `src/lib/utils/auth.ts` — different cookie, different collection
 * (`users` vs `adminUsers`), different session mechanism. A customer
 * session can never be read as an admin session and vice versa, so a
 * customer account cannot reach the admin dashboard.
 *
 * Strategy notes:
 *   - `session.strategy: "jwt"` is mandatory here because the
 *     Credentials provider can't use database sessions. Google and the
 *     magic-link (Nodemailer) provider still go through the MongoDB
 *     adapter for user/account persistence; only the *session* itself
 *     lives in the JWT cookie.
 *   - The adapter writes to the `MMC` database so it shares the same
 *     `users` collection that `getUsersCollection()` indexes.
 *   - Route protection is done with server-side `auth()` guards in the
 *     `/account` page, mirroring how the admin dashboard guards itself
 *     in its layout — we deliberately don't put this in middleware.
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

// Brute-force guard for password sign-in, mirroring the admin login
// limiter (5 attempts / 15 min per IP). Without this, the Credentials
// callback would accept unlimited password guesses.
const customerLoginLimiter = createRateLimiter("customerLogin", {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

/**
 * Thrown from `authorize()` when the per-IP rate limit is hit. Auth.js
 * masks every other authorize failure as the generic `CredentialsSignin`
 * code; subclassing with our own `code` lets the login form tell the
 * "rate limited" case apart from "wrong password".
 */
class RateLimitedSignin extends CredentialsSignin {
  code = "RateLimited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: "MMC" }),
  session: { strategy: "jwt" },
  // Vercel sets the host automatically; trustHost keeps local dev and
  // preview deployments from throwing UntrustedHost.
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check-email=1",
    error: "/login",
  },
  providers: [
    Google,
    Nodemailer({
      // Reuse the app's existing SMTP configuration (see src/emails/send.ts).
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: `${process.env.EMAIL_FROM_NAME || "MMC Leeds"} <${
        process.env.EMAIL_FROM || "noreply@yourdomain.com"
      }>`,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        // Per-IP rate limit before touching the DB or hashing.
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        const { allowed } = await customerLoginLimiter.check(ip);
        if (!allowed) throw new RateLimitedSignin();

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const users = await getUsersCollection();
        const user = await users.findOne({ email });

        // No account, or an account that only has OAuth / magic-link
        // sign-in (no password set) — reject without revealing which.
        if (!user?.password) return null;

        const valid = await verifyPassword(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    // JWT strategy: `token.sub` already carries the user id for every
    // provider. Mirror it onto the session so client components and
    // API routes can read `session.user.id` directly.
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
