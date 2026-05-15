import NextAuth, { CredentialsSignin } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import React from "react";

import clientPromise from "@/lib/mongodb";
import { getUsersCollection } from "@/lib/models";
import { verifyPassword } from "@/lib/utils/auth";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { sendEmail } from "@/emails/send";
import { MagicLinkSignIn } from "@/emails/MagicLinkSignIn";

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

// Magic-link guard, keyed by the *recipient email* — without it, the
// sign-in form could be used to flood someone's inbox with sign-in
// links. 3 links per 15 min per address is plenty for a real retry.
const magicLinkLimiter = createRateLimiter("customerMagicLink", {
  maxRequests: 3,
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
    Google({
      // Google verifies email ownership, so it's safe to link a Google
      // sign-in to an existing account with the same address. Without
      // this, a customer who registered with email/password and later
      // clicks "Continue with Google" hits an OAuthAccountNotLinked
      // dead-end instead of just signing in.
      allowDangerousEmailAccountLinking: true,
    }),
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
      // Override the provider's plain-HTML default: rate-limit per
      // recipient, then send the branded React Email template.
      async sendVerificationRequest({ identifier, url }) {
        const { allowed } = await magicLinkLimiter.check(
          identifier.toLowerCase()
        );
        if (!allowed) {
          throw new Error(
            "Too many sign-in links requested for this email. Please wait a few minutes."
          );
        }
        const result = await sendEmail({
          to: identifier,
          subject: "Your sign-in link",
          react: React.createElement(MagicLinkSignIn, { url }),
        });
        if (!result.success) {
          throw new Error("Failed to send the sign-in link.");
        }
      },
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
    // Handle `useSession().update({ name })` from the account Settings
    // tab — refresh the name on the JWT so a profile edit shows up
    // immediately instead of only after the next sign-in.
    jwt({ token, trigger, session }) {
      if (
        trigger === "update" &&
        session &&
        typeof (session as { name?: unknown }).name === "string"
      ) {
        token.name = (session as { name: string }).name;
      }
      return token;
    },
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
