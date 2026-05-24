import {
  Calendar,
  Clock,
  Heart,
  Info,
  Package,
  Settings as SettingsIcon,
  Truck,
  type LucideIcon,
} from "lucide-react";

export const BUSINESS_NAME =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

export type OpenPanel = "account" | "menu" | null;

export type LinkItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  desc?: string;
};

// ── Menu data — real marketing routes ──────────────────────────────────
export const BRANDS: LinkItem[] = [
  { label: "Toyota", href: "/BrowseFleet?make=Toyota" },
  { label: "Honda", href: "/BrowseFleet?make=Honda" },
  { label: "BMW", href: "/BrowseFleet?make=BMW" },
  { label: "Audi", href: "/BrowseFleet?make=Audi" },
];

export const SERVICES: LinkItem[] = [
  { label: "Detailing", href: "/Services/Detailing" },
  { label: "Tints", href: "/Services/Tints" },
  { label: "Repairs", href: "/Services/Repairs" },
];

export const MORE: LinkItem[] = [
  {
    label: "Car Parts",
    href: "/CarParts",
    icon: Package,
    desc: "OEM & aftermarket",
  },
  {
    label: "Breakdown Recovery",
    href: "/Recoveries",
    icon: Truck,
    desc: "Round-the-clock recovery",
  },
  {
    label: "Track Booking",
    href: "/Booking/lookup",
    icon: Calendar,
    desc: "Check your viewing or service",
  },
  { label: "About Us", href: "/AboutUs", icon: Info },
];

export const ACCOUNT_LINKS: LinkItem[] = [
  { label: "Saved cars", href: "/account?tab=saved", icon: Heart },
  { label: "My bookings", href: "/account?tab=upcoming", icon: Calendar },
  { label: "Booking history", href: "/account?tab=history", icon: Clock },
  {
    label: "Account settings",
    href: "/account?tab=settings",
    icon: SettingsIcon,
  },
];

// ── Small primitives ───────────────────────────────────────────────────
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
