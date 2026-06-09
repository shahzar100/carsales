import { redirect } from "next/navigation";
import { isAuthenticated, hasMinimumRole, getSession } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import type { AdminRole, AdminUserSummary } from "@/lib/interfaces";
import UsersClient from "@/components/Admin/UsersClient";

/**
 * Admin user & access-level management — Server Component.
 *
 * (Server-component + client-island pattern, CLAUDE.md §6.) Reads the admin
 * roster server-side and hands a secret-free {@link AdminUserSummary} list to
 * the client island for interactivity.
 *
 * Authorization is two-tier, mirroring the API:
 *   - manager+ may view the roster and add users (same gate as the existing
 *     /api/admin/users create + lookup routes). Staff are bounced.
 *   - only admins can change access levels, send password resets, or remove
 *     accounts. The island hides those controls below admin; the API enforces
 *     it regardless of what the client sends.
 */
export default async function AdminUsersPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  // Staff don't manage users — send them back to the dashboard.
  if (!(await hasMinimumRole("manager"))) redirect("/admin/dashboard");

  const session = await getSession();
  const collection = await getAdminUsersCollection();
  const docs = await collection
    .find({}, { projection: { passwordHash: 0, totpSecret: 0 } })
    .sort({ createdAt: 1 })
    .toArray();

  const initialUsers: AdminUserSummary[] = docs.map((doc) => ({
    _id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    role: doc.role,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : undefined,
    lastLogin: doc.lastLogin
      ? new Date(doc.lastLogin).toISOString()
      : undefined,
    twoFactorEnabled: doc.totpEnabled === true,
    // See GET /api/admin/users: gate on `!lastLogin` so an active user with
    // an outstanding reset link isn't mislabelled as never-set-up.
    pendingSetup: !doc.lastLogin && Boolean(doc.resetToken),
  }));

  return (
    <UsersClient
      initialUsers={initialUsers}
      currentUsername={session.username ?? ""}
      currentRole={(session.role as AdminRole) ?? "staff"}
    />
  );
}
