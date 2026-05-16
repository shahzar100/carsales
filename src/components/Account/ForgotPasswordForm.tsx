"use client";

import { useState } from "react";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/UI/Button";
import { InfoBanner } from "@/components/Form/FormPrimitives";

/**
 * Customer "forgot password" form.
 *
 * Posts the email to `/api/auth/forgot-password`, which always responds
 * with a generic success (no account-enumeration). So on a 2xx we show
 * the same "check your inbox" confirmation whether or not the address
 * was actually registered.
 *
 * Customers who signed up with Google or a magic link have no password
 * to reset — they should just use those methods on the login page.
 */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setError("Too many requests. Please wait a few minutes and try again.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.1 }}
          className="mx-auto inline-block"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </motion.div>
        <h2 className="mt-3 text-lg font-semibold text-gray-900">
          Check your inbox
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          If <span className="font-medium">{email}</span> has an account with a
          password, we&apos;ve sent a reset link. It expires in 1 hour.
        </p>
      </motion.div>
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

      <Button type="submit" fullWidth loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}
