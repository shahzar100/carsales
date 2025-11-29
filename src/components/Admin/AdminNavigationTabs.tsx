"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Calendar, Eye, Settings } from "lucide-react";
import AddCarModal from "./CarModal";

export default function AdminNavigationTabs() {
  const pathname = usePathname();

  const tabs = [
    { id: "/admin/dashboard", label: "Cars", icon: Car },
    {
      id: "/admin/dashboard/service",
      label: "Service Bookings",
      icon: Calendar,
    },
    { id: "/admin/dashboard/viewing", label: "Car Viewings", icon: Eye },
    { id: "/admin/dashboard/shop", label: "Shop Settings", icon: Settings },
  ];

  return (
    <div className="flex items-center justify-between border-b bg-white p-4">
      <div className="mx-auto max-w-7xl">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id}
                className={`flex items-center gap-2 border-b-2 px-2 py-4 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <AddCarModal />
    </div>
  );
}
