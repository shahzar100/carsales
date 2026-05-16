import React from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { AdminForm } from "@/components/Admin";
import AuthShell from "@/components/Account/AuthShell";

/**
 * Admin login page.
 *
 * (#10) Server-checks the session first — if you're already logged in,
 * we redirect straight to the dashboard instead of showing the form
 * and then bouncing you with client-side JS.
 */
export default async function AdminAuthPage() {
  const authed = await isAuthenticated();
  if (authed) redirect("/admin/dashboard");

  return (
    <AuthShell
      title="Admin Portal"
      subtitle=""
      variant="admin"
      footer={{ prompt: "Protected area. Authorized personnel only." }}
    >
      <AdminForm />
    </AuthShell>
  );
}
