import React from "react";
import { AdminNavigationTabs, AuthWrapper } from "@/components/Admin";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="grid min-h-screen grid-rows-[auto_1fr] bg-gray-50">
        {/* Header */}
        <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-white px-4 py-3 shadow-sm">
          <Link
            href="/admin/dashboard"
            className="text-xl font-bold text-gray-900"
          >
            Admin Dashboard
          </Link>

          <AdminNavigationTabs />
        </nav>

        {/* Content */}
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}
