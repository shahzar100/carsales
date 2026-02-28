"use client";
import { Car, Calendar, Eye, Settings, LogOut } from "lucide-react";
import NavMenu from "@/components/Dropdown/NavMenu";
import NavLink from "@/components/Dropdown/NavLink";
import { useAuth } from "../../../contexts/AuthContext";
import LinkPrimaryButton from "@/components/Helpful/Buttons/LinkPrimaryButton";
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
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-white px-4 py-3 shadow-sm">
      <a href="/admin/dashboard" className="text-xl font-bold text-gray-900">
        Admin Dashboard
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
          <LinkPrimaryButton href="/admin/dashboard/add" text={"Create New"} />
          <Button onClick={logout} variant="secondary" disabled={false}>
            <LogOut className="h-4 w-4 text-red-500" />
            <span className="hidden text-red-500 sm:inline">Logout</span>
          </Button>
        </NavMenu>
      )}
    </nav>
  );
}
