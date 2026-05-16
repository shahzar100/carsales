"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import Button from "@/components/Helpful/Buttons/Button";
import { InfoBanner } from "@/components/Form/FormPrimitives";

interface Props {
  token: string;
}

const PASSWORD_MIN = 12;

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError("Password must include uppercase, lowercase, and a digit.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/admin/login"), 2000);
      } else {
        setError(result.error || "Could not reset password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>Password updated. Redirecting to sign-in…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="new-password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          New password
        </label>
        <div className="relative">
          <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={PASSWORD_MIN}
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
            placeholder="At least 12 characters"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Must include uppercase, lowercase, and a digit.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Confirm password
        </label>
        <div className="relative">
          <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
            placeholder="Re-enter the password"
          />
        </div>
      </div>

      {error && (
        <InfoBanner
          variant="error"
          icon={<AlertCircle className="h-4 w-4 shrink-0" />}
        >
          {error}
        </InfoBanner>
      )}

      <Button type="submit" loading={loading} size="lg" customWidth="w-full">
        {loading ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
