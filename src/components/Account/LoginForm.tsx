"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Button from "@/components/UI/Button";
import { InfoBanner } from "@/components/Form/FormPrimitives";

/**
 * Customer sign-in form. Three routes in, all landing on the same
 * session:
 *   - email + password  → Credentials provider (verified in src/auth.ts)
 *   - magic link        → Nodemailer provider, emails a one-time link
 *   - Google            → OAuth, full-page redirect
 *
 * Auth.js error codes come back either in the `?error=` query param
 * (OAuth failures redirect here via `pages.error`) or in the result of
 * `signIn(..., { redirect: false })` for the in-page providers.
 */

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect email or password.",
  RateLimited:
    "Too many sign-in attempts. Please wait a few minutes and try again.",
  OAuthAccountNotLinked:
    "That email is already registered with a different sign-in method. Use the original method, or sign in and link Google from your account.",
  Verification: "That sign-in link has expired. Request a new one below.",
  Configuration:
    "Sign-in isn't configured correctly. Please contact us if this persists.",
};

function friendlyError(code: string | null): string {
  if (!code) return "";
  return ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => friendlyError(params.get("error")));
  const [magicSent, setMagicSent] = useState(params.get("check-email") === "1");
  const [loading, setLoading] = useState<null | "password" | "magic" | "google">(
    null
  );

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("password");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(friendlyError(res.error));
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("magic");
    try {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Couldn't send the sign-in link. Check the email address.");
        return;
      }
      setMagicSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (magicSent) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        className="text-center"
      >
        <m.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.1 }}
          className="mx-auto inline-block"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </m.div>
        <h2 className="mt-3 text-lg font-semibold text-gray-900">
          Check your inbox
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          We&apos;ve sent a sign-in link
          {email ? (
            <>
              {" "}
              to <span className="font-medium">{email}</span>
            </>
          ) : null}
          . It expires in 24 hours.
        </p>
        <button
          type="button"
          onClick={() => {
            setMagicSent(false);
            setMode("magic");
          }}
          className="mt-4 text-sm font-medium text-red-600 hover:underline"
        >
          Use a different email
        </button>
      </m.div>
    );
  }

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {error && (
          <InfoBanner
            key={error}
            variant="error"
            animated
            icon={<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          >
            {error}
          </InfoBanner>
        )}
      </AnimatePresence>

      {/* ── Google ───────────────────────────────────────── */}
      <Button
        variant="outline"
        fullWidth
        loading={loading === "google"}
        onClick={() => {
          setLoading("google");
          signIn("google", { callbackUrl });
        }}
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        OR
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* ── Email + password / magic link ────────────────── */}
      <form
        onSubmit={mode === "password" ? handlePasswordSignIn : handleMagicLink}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {mode === "password" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          loading={loading === "password" || loading === "magic"}
        >
          {mode === "password" ? "Sign in" : "Email me a sign-in link"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "password" ? "magic" : "password");
          setError("");
        }}
        className="block w-full text-center text-sm font-medium text-red-600 hover:underline"
      >
        {mode === "password"
          ? "Email me a sign-in link instead"
          : "Sign in with a password instead"}
      </button>
    </div>
  );
}
