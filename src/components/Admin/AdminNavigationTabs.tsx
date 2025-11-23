"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Calendar, Eye, Settings } from "lucide-react";

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
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
