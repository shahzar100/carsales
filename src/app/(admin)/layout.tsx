import React from "react";
import { AdminNavigationTabs, AuthWrapper } from "@/components/Admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="grid min-h-screen grid-rows-[auto_1fr]">
        {/* Header */}
        <AdminNavigationTabs />
        {/* Content */}
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}
