import React from "react";
import type { Metadata } from "next";
import { AdminNavigationTabs } from "@/components/Admin";
import AuthProvider from "@/contexts/AuthContext";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

/**
 * Render the admin shell at request time. `/admin/login` would otherwise
 * be statically prerendered, and prerendering the client-component shell
 * (AuthProvider + AdminNavigationTabs) trips Next 16's
 * "Cannot read properties of null (reading 'useState')" export error.
 * Mirrors the same `force-dynamic` fix already applied to the marketing
 * layout and the admin dashboard layout.
 */
export const dynamic = "force-dynamic";

/**
 * (#10) Admin shell.
 *
 * The auth guard now lives in `admin/dashboard/layout.tsx` — that's the
 * subtree that requires authentication. The login route shares this
 * outer shell but doesn't need a session.
 *
 * `AuthProvider` is kept so client components (the navigation tabs'
 * Logout button, the login redirect after success) can call `logout()`
 * and `login()`. It no longer blocks rendering — the server-side guard
 * handles that.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="grid min-h-screen grid-rows-[auto_1fr] overflow-x-hidden bg-gray-50">
        <AdminNavigationTabs />
        <main className="flex w-full max-w-7xl flex-col gap-4 overflow-x-hidden px-4 py-8 lg:mx-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
