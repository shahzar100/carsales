"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldOff, AlertCircle } from "lucide-react";
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
        {enabled ? (
          <ShieldCheck className="h-6 w-6 text-green-600" />
        ) : (
          <ShieldOff className="h-6 w-6 text-gray-400" />
        )}
        <div>
          <h2 className="text-lg font-semibold">Two-factor authentication</h2>
          <p className="text-sm text-gray-600">
            {enabled
              ? "Enabled — you'll be asked for a 6-digit code at every login."
              : "Not enabled. Add a second factor to harden the account."}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Enrolment flow */}
      {!enabled && step === "idle" && (
        <Button
          type="button"
          onClick={startEnrol}
          loading={loading}
          className="mt-6"
        >
          Enable 2FA
        </Button>
      )}

      {step === "verifying" && (
        <form onSubmit={verifyCode} className="mt-6 space-y-4">
          {qrSrc && (
            <div className="flex flex-col items-center gap-2">
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
            </div>
          )}
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer">Can&apos;t scan? Show secret</summary>
            <code className="mt-2 block break-all rounded bg-gray-100 p-2 font-mono text-xs">
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
        </form>
      )}

      {enabled && step === "idle" && (
        <Button
          type="button"
          onClick={() => setStep("disabling")}
          variant="ghost"
          className="mt-6 text-red-600"
        >
          Disable 2FA
        </Button>
      )}

      {step === "disabling" && (
        <form onSubmit={disable} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Confirm with your current password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
        </form>
      )}
    </section>
  );
}
