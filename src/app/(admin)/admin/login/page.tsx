import React from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { AdminForm } from "@/components/Admin";

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
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Admin Portal</h1>
        </div>
        <AdminForm />
        <p className="mt-6 text-center text-sm text-gray-500">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
