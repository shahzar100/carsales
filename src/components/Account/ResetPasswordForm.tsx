"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Button from "@/components/UI/Button";
import { InfoBanner } from "@/components/Form/FormPrimitives";

/**
 * Customer "set a new password" form — the consumer side of the reset
 * flow. Takes the plaintext token from the email link (validated for
 * shape by the page before this renders) and posts it with the new
 * password to `/api/auth/reset-password`.
 *
 * On success it bounces to /login so the customer signs in fresh with
 * the new password rather than being auto-signed-in here.
 */
export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Couldn't reset your password. Please try again.");
        return;
      }
      setDone(true);
      // Brief confirmation, then over to the login page.
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
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
          Password updated
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Taking you to the sign-in page…
        </p>
      </m.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          New password
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
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Confirm new password
        </label>
        <div className="relative">
          <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            placeholder="Re-enter your new password"
          />
        </div>
      </div>

      <Button type="submit" fullWidth loading={loading}>
        Set new password
      </Button>
    </form>
  );
}
