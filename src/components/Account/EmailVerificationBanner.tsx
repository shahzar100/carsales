"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, MailWarning, Loader2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

/**
 * Dashboard banner that nudges email/password customers to verify their
 * address. Verification is "soft" — they can use the site unverified —
 * so this is a nudge, not a wall.
 *
 * Self-contained: fetches `/api/account/profile` for the `emailVerified`
 * flag and renders nothing once verified (OAuth / magic-link customers
 * are verified by their provider, so they never see it). It also reads
 * the `?verified=` param the verify-email route redirects back with:
 *   - `1`       → just-verified success confirmation
 *   - `expired` → the link was stale; offer a resend
 */
export default function EmailVerificationBanner() {
  const params = useSearchParams();
  const verifiedParam = params.get("verified");

  const [verified, setVerified] = useState<boolean | null>(null);
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/profile", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && res.ok && json.success) {
          setVerified(Boolean(json.data.emailVerified));
        } else if (!cancelled) {
          setVerified(true); // fail open — don't nag if we can't tell
        }
      } catch {
        if (!cancelled) setVerified(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function resend() {
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setResendState(json.data?.verified ? "idle" : "sent");
        if (json.data?.verified) setVerified(true);
      } else {
        setResendState("error");
      }
    } catch {
      setResendState("error");
    }
  }

  // Just-verified confirmation takes priority over everything else.
  if (verifiedParam === "1" && verified !== false) {
    return (
      <m.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        style={{ overflow: "hidden" }}
      >
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          <m.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 460, damping: 18, delay: 0.1 }}
            className="inline-flex shrink-0"
          >
            <MailCheck className="h-4 w-4" aria-hidden="true" />
          </m.span>
          Your email address has been verified — thank you.
        </div>
      </m.div>
    );
  }

  // Still loading, or verified → nothing to show.
  if (verified !== false) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      style={{ overflow: "hidden" }}
    >
      <div className="mt-6 flex flex-col gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-start gap-2">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {verifiedParam === "expired"
            ? "That verification link has expired. Send yourself a fresh one:"
            : "Please verify your email address to secure your account."}
        </span>
        <span className="shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {resendState === "sent" ? (
              <m.span
                key="sent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="font-medium"
              >
                Sent — check your inbox.
              </m.span>
            ) : (
              <m.button
                key="resend"
                type="button"
                onClick={resend}
                disabled={resendState === "sending"}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 font-semibold text-amber-900 underline underline-offset-2 hover:no-underline disabled:opacity-60"
              >
                {resendState === "sending" && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {resendState === "error"
                  ? "Couldn't send — try again"
                  : "Resend verification email"}
              </m.button>
            )}
          </AnimatePresence>
        </span>
      </div>
    </m.div>
  );
}
