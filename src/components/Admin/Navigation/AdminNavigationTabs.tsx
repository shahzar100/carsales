"use client";
import { useRouter } from "next/navigation";
import { Car, Calendar, Eye, Settings, LogOut } from "lucide-react";
import NavMenu from "@/components/Dropdown/NavMenu";
import NavLink from "@/components/Dropdown/NavLink";
import DashboardMenuButtons from "./MenuButtons";

export default function AdminNavigationTabs() {
  const router = useRouter();

  const links = [
    { href: "/admin/dashboard", text: "Cars", icon: Car },
    {
      href: "/admin/dashboard/service",
      text: "Service Bookings",
      icon: Calendar,
    },
    { href: "/admin/dashboard/viewing", text: "Car Viewings", icon: Eye },
    { href: "/admin/dashboard/shop", text: "Shop Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <NavMenu title="Admin Menu">
      {links.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          text={link.text}
          icon={link.icon}
        />
      ))}

      <DashboardMenuButtons />

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-red-600 transition-colors hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </NavMenu>
  );
}
