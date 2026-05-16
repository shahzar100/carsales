"use client";
import React, { useState } from "react";
import { Lock, User, AlertCircle, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "@/components/Helpful/Buttons/Button";

const AdminForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2fa, setRequires2fa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          ...(requires2fa ? { totpCode } : {}),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        login();
        return;
      }

      // (Day 12.2) Server signals "your credentials are valid but we need
      // a 2FA code." Switch the form into 2FA mode instead of showing an
      // error.
      if (result.requires2fa) {
        setRequires2fa(true);
        if (response.status === 401) {
          // Wrong code on a follow-up POST
          setError(result.error || "Invalid 2FA code");
        }
        return;
      }

      setError(result.error || "Login failed");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="w-full"
    >
      <div className="rounded-xl bg-white p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait" initial={false}>
            {!requires2fa ? (
              <motion.div
                key="creds"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="username"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                      placeholder="Enter your username"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="2fa"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <label
                  htmlFor="totpCode"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Authenticator code
                </label>
                <div className="relative">
                  <motion.span
                    initial={{ scale: 0.6, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.1 }}
                    className="absolute top-3 left-3 inline-flex"
                  >
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                  </motion.span>
                  <input
                    id="totpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) =>
                      setTotpCode(e.target.value.replace(/\D/g, ""))
                    }
                    required
                    autoFocus
                    className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 tracking-widest shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                    placeholder="123 456"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

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
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            loading={loading}
            size="lg"
            customWidth="w-full"
          >
            {loading
              ? "Signing in..."
              : requires2fa
                ? "Verify"
                : "Sign In"}
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default AdminForm;
