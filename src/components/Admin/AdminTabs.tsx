import { Car, Calendar, Eye, Settings } from "lucide-react";
import { ActiveTab } from "./types";

interface AdminTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export default function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const tabs = [
    { id: "cars" as const, label: "Cars", icon: Car },
    { id: "service" as const, label: "Service Bookings", icon: Calendar },
    { id: "viewing" as const, label: "Car Viewings", icon: Eye },
    { id: "shop" as const, label: "Shop Settings", icon: Settings },
  ];

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
