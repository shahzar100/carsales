"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotificationComponent, Notification } from "@/components/Admin";
import { LogOut } from "lucide-react";
import NavMenu from "@/components/Dropdown/NavMenu";
import NavLink from "@/components/Dropdown/NavLink";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [notification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logout");
      const result = await response.json();
      if (!result.isLoggedIn) {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-gray-50">
      {/* Notification */}
      {notification && <NotificationComponent notification={notification} />}

      {/* Header */}
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-white px-4 py-3 shadow-sm">
        <Link
          href="/admin/dashboard"
          className="text-xl font-bold text-gray-900"
        >
          Admin Dashboard
        </Link>

        <NavMenu title="Admin Menu">
          <NavLink href="/admin/dashboard" text="Cars" />
          <NavLink href="/admin/dashboard/service" text="Service Bookings" />
          <NavLink href="/admin/dashboard/viewing" text="Car Viewings" />
          <NavLink href="/admin/dashboard/shop" text="Shop Settings" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </NavMenu>
      </nav>

      {/* Quick Actions Bar */}

      {/* Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
