"use client";
import Link from "next/link";
import {
  Car,
  Calendar,
  Eye,
  Settings,
  LogOut,
  PlusCircle,
  Activity,
  Cog,
  ShieldCheck,
  Bookmark,
  ArrowLeftRight,
  MessageSquareQuote,
  UserCog,
} from "lucide-react";
import NavMenu from "@/components/Dropdown/NavMenu";
import NavLink from "@/components/Dropdown/NavLink";
import { useAuth } from "../../../contexts/AuthContext";
import Button from "@/components/Helpful/Buttons/Button";

interface NavLinkItem {
  href: string;
  text: string;
  icon: typeof Car;
  /** Minimum role required to see this tab. Omit for tabs visible to all. */
  minRole?: "staff" | "manager" | "admin";
}

const links: NavLinkItem[] = [
  { href: "/admin/dashboard/cars", text: "Cars", icon: Car },
  { href: "/admin/dashboard/carparts", text: "Car Parts", icon: Cog },
  {
    href: "/admin/dashboard/service",
    text: "Service Bookings",
    icon: Calendar,
  },
  { href: "/admin/dashboard/viewing", text: "Car Viewings", icon: Eye },
  {
    href: "/admin/dashboard/reservations",
    text: "Reservations",
    icon: Bookmark,
  },
  {
    href: "/admin/dashboard/part-exchange",
    text: "Part-Exchange",
    icon: ArrowLeftRight,
  },
  {
    href: "/admin/dashboard/quotes",
    text: "Quotes",
    icon: MessageSquareQuote,
  },
  { href: "/admin/dashboard/shop", text: "Business Info", icon: Settings },
  { href: "/admin/dashboard/add", text: "Create New", icon: PlusCircle },
  {
    href: "/admin/dashboard/users",
    text: "Users & Access",
    icon: UserCog,
    // The page itself is manager+; staff are redirected. Hiding the tab
    // below manager keeps the menu honest (no link that just bounces you).
    minRole: "manager" as const,
  },
  { href: "/admin/dashboard/status", text: "System Status", icon: Activity },
  { href: "/admin/dashboard/audit", text: "Audit Log", icon: ShieldCheck },
];

const ROLE_LEVEL: Record<string, number> = { staff: 1, manager: 2, admin: 3 };

export default function AdminNavigationTabs() {
  const { isLoggedIn, role, logout } = useAuth();

  // Role gates display only — every destination enforces its own access
  // server-side. While the session check is in flight `role` is null, so
  // role-gated tabs stay hidden until we know the user qualifies.
  const userLevel = role ? (ROLE_LEVEL[role] ?? 0) : 0;
  const visibleLinks = links.filter(
    (link) => !link.minRole || userLevel >= ROLE_LEVEL[link.minRole]
  );

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-black px-4 py-3 shadow-md">
      <Link
        href="/admin/dashboard"
        className="text-xl font-bold text-white sm:text-2xl"
      >
        Admin <span className="text-red-600">Dashboard</span>
      </Link>
      {isLoggedIn && (
        <NavMenu title="Admin Menu">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              text={link.text}
              icon={link.icon}
            />
          ))}
          <Button onClick={logout} variant="ghost" disabled={false}>
            <LogOut className="h-4 w-4 text-red-600" />
            <span className="hidden text-red-600 sm:inline">Logout</span>
          </Button>
        </NavMenu>
      )}
    </nav>
  );
}
