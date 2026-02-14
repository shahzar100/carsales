import React from "react";
import { AdminNavigationTabs, AuthWrapper } from "@/components/Admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="grid min-h-screen grid-rows-[auto_1fr] overflow-x-hidden">
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
