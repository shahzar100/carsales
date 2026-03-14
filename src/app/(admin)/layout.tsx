import React from "react";
import type { Metadata } from "next";
import { AdminNavigationTabs, AuthWrapper } from "@/components/Admin";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="grid min-h-screen grid-rows-[auto_1fr] overflow-x-hidden bg-gray-50">
        {/* Header */}
        <AdminNavigationTabs />
        {/* Content */}
        <main className="flex w-full max-w-7xl flex-col gap-4 overflow-x-hidden px-4 py-8 lg:mx-auto">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}
