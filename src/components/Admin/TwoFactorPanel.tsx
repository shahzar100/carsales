"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldOff, AlertCircle } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Button from "@/components/Helpful/Buttons/Button";

interface Props {
  initialEnabled: boolean;
}

type Step = "idle" | "enrolling" | "verifying" | "disabling";

export default function TwoFactorPanel({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [secret, setSecret] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function startEnrol() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/2fa/enroll", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start enrolment");
        return;
      }
      setSecret(data.secret);
      // QR is rendered client-side via the `qrcode` dynamic import — sending
      // the URI through a third-party QR API would leak the secret.
      const QR = await import("qrcode");
      const dataUrl = await QR.toDataURL(data.uri, { width: 220, margin: 1 });
      setQrSrc(dataUrl);
      setStep("verifying");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }
      setEnabled(true);
      setStep("idle");
      setSecret("");
      setQrSrc("");
      setCode("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not disable 2FA");
        return;
      }
      setEnabled(false);
      setStep("idle");
      setPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={enabled ? "on" : "off"}
            initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 460, damping: 22 }}
            className="inline-flex"
          >
            {enabled ? (
              <ShieldCheck className="h-6 w-6 text-green-600" />
            ) : (
              <ShieldOff className="h-6 w-6 text-gray-400" />
            )}
          </m.span>
        </AnimatePresence>
        <div>
          <h2 className="text-lg font-semibold">Two-factor authentication</h2>
          <m.p
            key={enabled ? "on-text" : "off-text"}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-gray-600"
          >
            {enabled
              ? "Enabled — you'll be asked for a 6-digit code at every login."
              : "Not enabled. Add a second factor to harden the account."}
          </m.p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <m.div
            key={error}
            initial={{ opacity: 0, y: -4, height: 0, marginTop: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              marginTop: 16,
              x: [0, -6, 6, -4, 4, -2, 0],
              transition: {
                opacity: { duration: 0.18 },
                y: { duration: 0.18 },
                height: { duration: 0.18 },
                marginTop: { duration: 0.18 },
                x: { duration: 0.36, ease: "easeOut" },
              },
            }}
            exit={{
              opacity: 0,
              y: -4,
              height: 0,
              marginTop: 0,
              transition: { duration: 0.15 },
            }}
            style={{ overflow: "hidden" }}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Enrolment flow */}
      <AnimatePresence mode="wait" initial={false}>
        {!enabled && step === "idle" && (
          <m.div
            key="enable-btn"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-6"
          >
            <Button type="button" onClick={startEnrol} loading={loading}>
              Enable 2FA
            </Button>
          </m.div>
        )}

        {step === "verifying" && (
          <m.form
            key="verify-form"
            onSubmit={verifyCode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 space-y-4"
          >
            {qrSrc && (
              <m.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 24,
                  delay: 0.1,
                }}
                className="flex flex-col items-center gap-2"
              >
                <Image
                  src={qrSrc}
                  alt="2FA QR code"
                  width={220}
                  height={220}
                  unoptimized
                />
                <p className="text-xs text-gray-500">
                  Scan with Google Authenticator, 1Password, Authy, …
                </p>
              </m.div>
            )}
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer">
                Can&apos;t scan? Show secret
              </summary>
              <code className="mt-2 block rounded bg-gray-100 p-2 font-mono text-xs break-all">
                {secret}
              </code>
            </details>
            <label
              htmlFor="totpCode"
              className="block text-sm font-medium text-gray-700"
            >
              Enter the 6-digit code from your app
            </label>
            <input
              id="totpCode"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus -- modal focus management: WCAG 2.4.3
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-4 py-3 tracking-widest shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
              placeholder="123 456"
            />
            <div className="flex gap-2">
              <Button type="submit" loading={loading}>
                Verify and enable
              </Button>
              <Button
                type="button"
                onClick={() => setStep("idle")}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </m.form>
        )}

        {enabled && step === "idle" && (
          <m.div
            key="disable-btn"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-6"
          >
            <Button
              type="button"
              onClick={() => setStep("disabling")}
              variant="ghost"
              className="text-red-600"
            >
              Disable 2FA
            </Button>
          </m.div>
        )}

        {step === "disabling" && (
          <m.form
            key="disable-form"
            onSubmit={disable}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 space-y-4"
          >
            <label
              htmlFor="disable2faPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm with your current password
            </label>
            <input
              id="disable2faPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus -- modal focus management: WCAG 2.4.3
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
              placeholder="Current password"
            />
            <div className="flex gap-2">
              <Button type="submit" loading={loading}>
                Disable 2FA
              </Button>
              <Button
                type="button"
                onClick={() => setStep("idle")}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </m.form>
        )}
      </AnimatePresence>
    </section>
  );
}
