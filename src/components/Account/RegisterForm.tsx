"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/UI/Button";

/**
 * Customer sign-up form for the email + password method.
 *
 * Two steps, both fired from one submit: POST /api/auth/register creates
 * the `users` document with a bcrypt hash, then we immediately call
 * `signIn("credentials")` so the customer lands signed in rather than
 * being bounced to the login page.
 *
 * Google and magic-link users never see this form — they're created by
 * the Auth.js adapter on first sign-in from the login page.
 */
export default function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Set by BookingAuthGate when the visitor came here mid-booking — land
  // them back on the booking form, not the dashboard.
  const callbackUrl = params.get("callbackUrl") || "/account";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Couldn't create your account.");
        return;
      }

      // Account exists — establish the session straight away.
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        // Account was created but auto sign-in failed — send them to login,
        // preserving the callbackUrl so they still end up where they meant to.
        router.push(
          `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {error && (
          <motion.div
            key={error}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              x: [0, -6, 6, -4, 4, -2, 0],
              transition: {
                opacity: { duration: 0.18 },
                y: { duration: 0.18 },
                height: { duration: 0.18 },
                x: { duration: 0.36, ease: "easeOut" },
              },
            }}
            exit={{ opacity: 0, y: -4, height: 0, transition: { duration: 0.15 } }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="outline"
        fullWidth
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        OR
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Full name
          </label>
          <div className="relative">
            <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
              placeholder="Jane Smith"
            />
          </div>
        </div>

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

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
              placeholder="At least 8 characters"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Use at least 8 characters.
          </p>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Create account
        </Button>
      </form>
    </div>
  );
}
