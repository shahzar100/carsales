import { NextRequest } from "next/server";
import { z } from "zod";
import { ipAddress, waitUntil } from "@vercel/functions";

import { getUsersCollection } from "@/lib/models";
import { hashPassword } from "@/lib/utils/auth";
import { sendVerificationEmail } from "@/lib/utils/emailVerification";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import {
  ok,
  badRequest,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";

/**
 * Customer account creation for the email + password sign-in method.
 *
 * Google and magic-link users are provisioned by the Auth.js adapter on
 * first sign-in and never hit this route — it exists purely to set a
 * bcrypt password hash on a `users` document so the Credentials provider
 * in src/auth.ts has something to verify against.
 *
 * After creating the account the client calls `signIn("credentials")`
 * itself; we deliberately don't mint a session here so there's one code
 * path for establishing a session.
 */

// 5 sign-ups per hour per IP — generous for real users, costly for
// anyone trying to mass-create accounts.
const registerLimiter = createRateLimiter("customerRegister", {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
});

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export async function POST(request: NextRequest) {
  try {
    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await registerLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests(
        "Too many sign-up attempts. Please try again later.",
        { headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid registration details"
      );
    }

    const { name, email, password } = parsed.data;
    const users = await getUsersCollection();

    // Pre-check for a friendly error. The unique index on `email`
    // (see getUsersCollection) is the real guard against a race between
    // two concurrent registrations — the catch below handles that.
    const existing = await users.findOne({ email });
    if (existing) {
      return badRequest("An account with that email already exists");
    }

    const now = new Date();
    try {
      await users.insertOne({
        name,
        email,
        password: await hashPassword(password),
        emailVerified: null,
        savedCarIds: [],
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      // Duplicate-key from the unique email index — lost the race.
      if (
        typeof err === "object" &&
        err !== null &&
        (err as { code?: number }).code === 11000
      ) {
        return badRequest("An account with that email already exists");
      }
      throw err;
    }

    // Fire the verification email in the background — the client signs
    // the user in immediately either way (verification is soft), so
    // there's no reason to block the response on SMTP.
    waitUntil(sendVerificationEmail(email));

    return ok({ email }, 201);
  } catch (error) {
    logError(error, { route: "POST /api/auth/register" });
    return serverError();
  }
}
