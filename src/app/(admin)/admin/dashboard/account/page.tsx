import { redirect } from "next/navigation";
import { isAuthenticated, getSession } from "@/lib/utils/auth";
import { getAdminUsersCollection } from "@/lib/models";
import TwoFactorPanel from "@/components/Admin/TwoFactorPanel";

/**
 * Admin account page — currently just hosts the 2FA enrol/disable panel.
 * Day 12.2 / Finding #14.
 */
export default async function AccountPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  const [session, users] = await Promise.all([
    getSession(),
    getAdminUsersCollection(),
  ]);
  const user = session.username
    ? await users.findOne({ username: session.username })
    : null;

  if (!user) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Account security</h1>
        <p className="mt-1 text-sm text-gray-600">
          Signed in as <strong>{user.username}</strong>
        </p>
      </header>

      <TwoFactorPanel initialEnabled={user.totpEnabled === true} />
    </div>
  );
}
