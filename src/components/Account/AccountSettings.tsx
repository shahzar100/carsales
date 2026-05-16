"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import Button from "@/components/UI/Button";

/**
 * The "Settings" tab of the account dashboard: edit display name, set or
 * change the password, and delete the account.
 *
 * On mount it pulls /api/account/profile for the two flags the UI needs
 * — `hasPassword` (decides "Change password" vs "Set a password") and is
 * otherwise self-contained. A name change calls `useSession().update()`
 * so the greeting and header reflect it without a re-login.
 */

type Profile = {
  name: string;
  email: string;
  hasPassword: boolean;
  emailVerified: boolean;
};

function Banner({ kind, children }: { kind: "ok" | "err"; children: string }) {
  // Re-key by `kind+children` so changing message replays the entry animation.
  return (
    <motion.div
      key={`${kind}-${children}`}
      initial={{ opacity: 0, y: -4, height: 0 }}
      animate={
        kind === "err"
          ? {
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
            }
          : {
              opacity: 1,
              y: 0,
              height: "auto",
              transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            }
      }
      style={{ overflow: "hidden" }}
      className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
        kind === "ok"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {kind === "ok" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </motion.div>
  );
}

export default function AccountSettings() {
  const { update } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Per-card form state.
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState<{ kind: "ok" | "err"; text: string }>();
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "err"; text: string }>();
  const [savingPw, setSavingPw] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/profile", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          if (!cancelled) setLoadError(true);
          return;
        }
        if (!cancelled) {
          setProfile(json.data);
          setName(json.data.name);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(undefined);
    setSavingName(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNameMsg({ kind: "err", text: json.error || "Couldn't save your name." });
        return;
      }
      // Refresh the JWT session so the greeting / header pick up the change.
      await update({ name: json.data.name });
      setNameMsg({ kind: "ok", text: "Name updated." });
    } catch {
      setNameMsg({ kind: "err", text: "Something went wrong. Please try again." });
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(undefined);
    setSavingPw(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(profile?.hasPassword ? { currentPassword } : {}),
          newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPwMsg({ kind: "err", text: json.error || "Couldn't update your password." });
        return;
      }
      setPwMsg({ kind: "ok", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setProfile((p) => (p ? { ...p, hasPassword: true } : p));
    } catch {
      setPwMsg({ kind: "err", text: "Something went wrong. Please try again." });
    } finally {
      setSavingPw(false);
    }
  }

  async function deleteAccount() {
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.error || "Couldn't delete your account.");
        setDeleting(false);
        return;
      }
      // The account is gone; the only thing left is the JWT cookie.
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <Banner kind="err">
        We couldn&apos;t load your settings just now. Please refresh the page.
      </Banner>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your settings…
      </div>
    );
  }

  const cardClass =
    "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";
  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <div className="max-w-xl space-y-6">
      {/* ── Profile ───────────────────────────────────────── */}
      <form onSubmit={saveName} className={cardClass}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User className="h-5 w-5 text-gray-500" aria-hidden="true" />
          Profile
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Signed in as{" "}
          <span className="font-medium text-gray-700">{profile.email}</span>
        </p>
        <div className="mt-4">
          <label htmlFor="settings-name" className={labelClass}>
            Display name
          </label>
          <input
            id="settings-name"
            type="text"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        {nameMsg && (
          <div className="mt-3">
            <Banner kind={nameMsg.kind}>{nameMsg.text}</Banner>
          </div>
        )}
        <div className="mt-4">
          <Button
            type="submit"
            loading={savingName}
            disabled={!name.trim() || name === profile.name}
          >
            Save name
          </Button>
        </div>
      </form>

      {/* ── Password ──────────────────────────────────────── */}
      <form onSubmit={savePassword} className={cardClass}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Lock className="h-5 w-5 text-gray-500" aria-hidden="true" />
          {profile.hasPassword ? "Change password" : "Set a password"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {profile.hasPassword
            ? "Update the password you use to sign in with email."
            : "You sign in with Google or a magic link. Set a password to also sign in with email."}
        </p>
        {profile.hasPassword && (
          <div className="mt-4">
            <label htmlFor="settings-current-pw" className={labelClass}>
              Current password
            </label>
            <input
              id="settings-current-pw"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <div className="mt-4">
          <label htmlFor="settings-new-pw" className={labelClass}>
            New password
          </label>
          <input
            id="settings-new-pw"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>
        {pwMsg && (
          <div className="mt-3">
            <Banner kind={pwMsg.kind}>{pwMsg.text}</Banner>
          </div>
        )}
        <div className="mt-4">
          <Button type="submit" loading={savingPw} disabled={newPassword.length < 8}>
            {profile.hasPassword ? "Change password" : "Set password"}
          </Button>
        </div>
      </form>

      {/* ── Danger zone ───────────────────────────────────── */}
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-red-900">
          <Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" />
          Delete account
        </h2>
        <p className="mt-1 text-sm text-red-800/80">
          Permanently deletes your account, saved cars and linked sign-in
          methods. Past bookings stay on record with the dealership. This
          can&apos;t be undone.
        </p>

        {deleteError && (
          <div className="mt-3">
            <Banner kind="err">{deleteError}</Banner>
          </div>
        )}

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete my account
          </button>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-sm font-medium text-red-900">
              Are you sure? This is permanent.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Yes, delete permanently
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
