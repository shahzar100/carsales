"use client";
import React, { useMemo, useState } from "react";
import {
  Eye,
  Wrench,
  ShieldCheck,
  UserPlus,
  Trash2,
  KeyRound,
  Loader2,
  Clock,
  Lock,
  ShieldAlert,
} from "lucide-react";
import {
  Badge,
  InfoBanner,
  FormButton,
  FormInput,
} from "@/components/Form/FormPrimitives";
import { useToast } from "@/hooks/useToast";
import { logError } from "@/lib/utils/observability";
import type { AdminRole, AdminUserSummary } from "@/lib/interfaces";

interface Props {
  initialUsers: AdminUserSummary[];
  currentUsername: string;
  currentRole: AdminRole;
}

const ROLE_LEVEL: Record<AdminRole, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
};

type BadgeColour = "gray" | "amber" | "red";

/**
 * Single source of truth for what each access level *actually* gates in this
 * codebase (verified against the `hasMinimumRole` checks across the API), so
 * the explainer below describes reality, not aspiration.
 */
const ROLE_META: Record<
  AdminRole,
  {
    label: string;
    colour: BadgeColour;
    icon: React.ComponentType<{ className?: string }>;
    summary: string;
    can: string[];
    cannot: string[];
  }
> = {
  staff: {
    label: "Staff",
    colour: "gray",
    icon: Eye,
    summary: "View-only — can see the dashboard but change nothing.",
    can: [
      "Sign in to the admin dashboard",
      "View cars, parts, bookings, viewings, reservations, quotes & part-exchanges",
    ],
    cannot: ["Create, edit, or delete anything"],
  },
  manager: {
    label: "Manager",
    colour: "amber",
    icon: Wrench,
    summary: "Day-to-day operations — runs the inventory and the diary.",
    can: [
      "Everything Staff can do",
      "Add, edit & delete cars and parts",
      "Manage bookings, viewings, reservations, quotes & part-exchanges",
      "Edit business info & upload images",
      "Add new admin users",
    ],
    cannot: [
      "Change access levels, reset other users' passwords, or remove users",
    ],
  },
  admin: {
    label: "Admin",
    colour: "red",
    icon: ShieldCheck,
    summary: "Full control — the trusted owner of the system.",
    can: [
      "Everything a Manager can do",
      "Change users' access levels",
      "Reset other users' passwords",
      "Remove user accounts",
      "View the audit log",
    ],
    cannot: [],
  },
};

const ORDER: AdminRole[] = ["staff", "manager", "admin"];

function RoleBadge({ role }: { role: AdminRole }) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  return (
    <Badge colour={meta.colour} icon={<Icon className="h-3 w-3" />}>
      {meta.label}
    </Badge>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UsersClient({
  initialUsers,
  currentUsername,
  currentRole,
}: Props) {
  const [users, setUsers] = useState<AdminUserSummary[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add-user form
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("staff");
  const [creating, setCreating] = useState(false);

  const toast = useToast();

  const isAdmin = currentRole === "admin";
  const callerLevel = ROLE_LEVEL[currentRole];
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );

  // Roles the current user is allowed to *grant* (never above their own).
  const grantableRoles = ORDER.filter((r) => ROLE_LEVEL[r] <= callerLevel);

  const refetch = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users as AdminUserSummary[]);
      }
    } catch (error) {
      logError(error, { context: "users-dashboard.refetch" });
    }
  };

  const handleCreate = async () => {
    if (!newUsername.trim() || !newEmail.trim()) {
      toast.error("Missing details", "Username and email are both required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not create user", data.error || "Please try again.");
        return;
      }
      toast.success(
        "User created",
        `A setup email was sent to ${newEmail.trim()} so they can set their own password.`
      );
      setNewUsername("");
      setNewEmail("");
      setNewRole("staff");
      await refetch();
    } catch (error) {
      logError(error, { context: "users-dashboard.create" });
      toast.error("Error", "Something went wrong creating the user.");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (user: AdminUserSummary, role: AdminRole) => {
    if (role === user.role) return;
    setBusyId(user._id);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not change access level", data.error || "Please try again.");
        return;
      }
      toast.success(
        "Access level updated",
        `${user.username} is now ${ROLE_META[role].label}.`
      );
      // Optimistically reflect the confirmed change so the row is correct
      // even if the reconciling refetch below fails (it swallows errors).
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role } : u))
      );
      await refetch();
    } catch (error) {
      logError(error, { context: "users-dashboard.roleChange" });
      toast.error("Error", "Something went wrong updating the access level.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReset = async (user: AdminUserSummary) => {
    setBusyId(user._id);
    try {
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", username: user.username }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not send reset", data.error || "Please try again.");
        return;
      }
      toast.success(
        user.pendingSetup ? "Setup link resent" : "Reset email sent",
        `A secure link was emailed to ${user.email}. It expires in 1 hour.`
      );
    } catch (error) {
      logError(error, { context: "users-dashboard.reset" });
      toast.error("Error", "Something went wrong sending the reset email.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: AdminUserSummary) => {
    setBusyId(user._id);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Could not remove user", data.error || "Please try again.");
        return;
      }
      toast.success("User removed", `${user.username} no longer has access.`);
      setConfirmDeleteId(null);
      await refetch();
    } catch (error) {
      logError(error, { context: "users-dashboard.delete" });
      toast.error("Error", "Something went wrong removing the user.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header>
        <h1 className="page-title tracking-tight">Users &amp; Access</h1>
        <p className="subtitle mt-1">
          Manage who can sign in to the admin dashboard and what they&apos;re
          allowed to do.
        </p>
      </header>

      {/* ── Access levels explained ────────────────────────────── */}
      <section aria-labelledby="access-levels-heading">
        <h2 id="access-levels-heading" className="section-title mb-1">
          Access levels explained
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Every admin user has exactly one access level. Higher levels include
          everything the levels below them can do.
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          {ORDER.map((role) => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            return (
              <div
                key={role}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-base font-semibold text-gray-900">
                      {meta.label}
                    </span>
                  </div>
                  <RoleBadge role={role} />
                </div>

                <p className="mb-3 text-sm text-gray-600">{meta.summary}</p>

                <ul className="space-y-1.5">
                  {meta.can.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {meta.cannot.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-400"
                    >
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Add user ───────────────────────────────────────────── */}
      <section
        aria-labelledby="add-user-heading"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h2
          id="add-user-heading"
          className="section-title mb-1 flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5 text-red-600" />
          Add an admin user
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          The new user is emailed a secure link to set their own password — no
          password is created or shown here.
        </p>

        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormInput
            label="Username"
            value={newUsername}
            onChange={setNewUsername}
            placeholder="e.g. jsmith"
            required
          />
          <FormInput
            label="Email"
            type="email"
            value={newEmail}
            onChange={setNewEmail}
            placeholder="e.g. john@example.com"
            required
          />
          <div>
            <label
              htmlFor="new-user-role"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Access level
            </label>
            <select
              id="new-user-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="input"
            >
              {grantableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r].label}
                </option>
              ))}
            </select>
          </div>
          <FormButton
            onClick={handleCreate}
            loading={creating}
            loadingText="Creating…"
            icon={<UserPlus className="h-4 w-4" />}
            iconPosition="left"
          >
            Create user
          </FormButton>
        </div>
      </section>

      {/* ── Roster ─────────────────────────────────────────────── */}
      <section aria-labelledby="roster-heading">
        <h2 id="roster-heading" className="section-title mb-3">
          Admin users{" "}
          <span className="text-sm font-normal text-gray-400">
            ({users.length})
          </span>
        </h2>

        {!isAdmin && (
          <InfoBanner
            variant="info"
            className="mb-4"
            icon={<ShieldAlert className="h-4 w-4 shrink-0" />}
          >
            You can view the team and add users. Only <strong>Admins</strong>{" "}
            can change access levels, send password resets, or remove accounts.
          </InfoBanner>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Access level</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last login</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelf = user.username === currentUsername;
                const isLastAdmin = user.role === "admin" && adminCount <= 1;
                const rowBusy = busyId === user._id;
                // An admin can't change their own level or strip the last admin.
                const roleLocked = isSelf || isLastAdmin;

                return (
                  <tr key={user._id} className="align-middle">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {user.username}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {user.pendingSetup && (
                          <Badge
                            colour="amber"
                            icon={<Clock className="h-3 w-3" />}
                          >
                            Pending setup
                          </Badge>
                        )}
                        {user.twoFactorEnabled && (
                          <Badge
                            colour="emerald"
                            icon={<ShieldCheck className="h-3 w-3" />}
                          >
                            2FA on
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Access level */}
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <div className="flex flex-col gap-1">
                          <select
                            aria-label={`Access level for ${user.username}`}
                            value={user.role}
                            disabled={roleLocked || rowBusy}
                            onChange={(e) =>
                              handleRoleChange(
                                user,
                                e.target.value as AdminRole
                              )
                            }
                            className="input max-w-[170px] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {grantableRoles.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_META[r].label}
                              </option>
                            ))}
                          </select>
                          {isLastAdmin && (
                            <span className="text-xs text-gray-400">
                              Last admin — locked
                            </span>
                          )}
                        </div>
                      ) : (
                        <RoleBadge role={user.role} />
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Last login */}
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(user.lastLogin)}
                    </td>

                    {/* Actions (admin only) */}
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleReset(user)}
                            disabled={rowBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            {user.pendingSetup ? "Resend setup" : "Reset"}
                          </button>

                          {confirmDeleteId === user._id ? (
                            <span className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                disabled={rowBusy}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {rowBusy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(user._id)}
                              disabled={isSelf || isLastAdmin || rowBusy}
                              title={
                                isSelf
                                  ? "You can't remove your own account"
                                  : isLastAdmin
                                    ? "You can't remove the last admin"
                                    : "Remove user"
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No admin users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
