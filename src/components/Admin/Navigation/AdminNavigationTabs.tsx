"use client";
import { Car, Calendar, Eye, Settings, LogOut, PlusCircle } from "lucide-react";
import NavMenu from "@/components/Dropdown/NavMenu";
import NavLink from "@/components/Dropdown/NavLink";
import { useAuth } from "../../../contexts/AuthContext";
import Button from "@/components/Helpful/Buttons/Button";

export default function AdminNavigationTabs() {
  const { isLoggedIn, logout } = useAuth();

  const links = [
    { href: "/admin/dashboard/cars", text: "Cars", icon: Car },
    {
      href: "/admin/dashboard/service",
      text: "Service Bookings",
      icon: Calendar,
    },
    { href: "/admin/dashboard/viewing", text: "Car Viewings", icon: Eye },
    { href: "/admin/dashboard/shop", text: "Shop Settings", icon: Settings },
    { href: "/admin/dashboard/add", text: "Create New", icon: PlusCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-black px-4 py-3 shadow-md">
      <a
        href="/admin/dashboard"
        className="text-xl font-bold text-white sm:text-2xl"
      >
        Admin <span className="text-red-500">Dashboard</span>
      </a>
      {isLoggedIn && (
        <NavMenu title="Admin Menu">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              text={link.text}
              icon={link.icon}
            />
          ))}
          <Button onClick={logout} variant="ghost" disabled={false}>
            <LogOut className="h-4 w-4 text-red-400" />
            <span className="hidden text-red-400 sm:inline">Logout</span>
          </Button>
        </NavMenu>
      )}
    </nav>
  );
}
