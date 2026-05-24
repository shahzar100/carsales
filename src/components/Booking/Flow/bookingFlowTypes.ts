import {
  Award,
  Droplets,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { BOOKING_SLOT_OPTIONS } from "@/lib/utils/bookingSlots";
import type { DetailingPackage, TintOption } from "@/lib/interfaces";
import type { PackageCardData } from "./PackageCard";
import type { ServiceKey } from "./ServiceCard";

// ── Validation helpers ───────────────────────────────────────
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[\d\s+()-]{7,20}$/;
export const today = () => new Date().toISOString().split("T")[0];
export const maxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
};
export const capLength = (s: string) => s.slice(0, 1000);

// Bookable time slots — sourced from the shared BOOKING_SLOTS constant so
// the form only ever offers slots the booking API will accept (previously
// the :30 slots here were silently rejected by validateAppointmentTime).
export const TIME_SLOTS = BOOKING_SLOT_OPTIONS;

// Static repair sub-services — no admin-managed list exists for these.
export const REPAIR_PACKAGES: Array<{
  id: string;
  label: string;
  description: string;
}> = [
  {
    id: "engine",
    label: "Engine & Performance",
    description:
      "Diagnostics, timing belts, sensors, performance issues, and warning lights.",
  },
  {
    id: "brakes",
    label: "Brakes & Safety",
    description: "Pads, discs, fluid, ABS, handbrake, and full safety checks.",
  },
  {
    id: "electrical",
    label: "Electrical Systems",
    description:
      "Battery, alternator, starter motor, lighting, and electrical faults.",
  },
  {
    id: "transmission",
    label: "Transmission & Drivetrain",
    description:
      "Clutch, gearbox, driveshaft, differential, and CV joints.",
  },
  {
    id: "mot",
    label: "General Service / MOT",
    description: "Annual service, MOT prep, fluids, and routine maintenance.",
  },
];

// ── PackageCard data mappers ─────────────────────────────────
// Map detailing packages from MongoDB into the local PackageCard shape.
export function mapDetailingPackages(
  packages: DetailingPackage[]
): PackageCardData[] {
  const ICONS: LucideIcon[] = [Droplets, Sparkles, Award, ShieldCheck];
  return packages.map((p, i) => ({
    id: p.id,
    name: p.name,
    description: p.subtitle,
    duration: p.duration,
    price: p.price,
    recommended: p.popular,
    icon: ICONS[i] ?? Sparkles,
    includes: [...p.exteriorFeatures, ...p.interiorFeatures].slice(0, 4),
  }));
}

export function mapTintOptions(tints: TintOption[]): PackageCardData[] {
  return tints.map((t) => ({
    id: t.name,
    name: t.name,
    description: t.description,
    duration: t.warranty,
    price: t.price,
    recommended: t.popular,
    icon: ShieldCheck,
    includes: t.features.slice(0, 4),
  }));
}

export function mapRepairs(): PackageCardData[] {
  return REPAIR_PACKAGES.map((r) => ({
    id: r.id,
    name: r.label,
    description: r.description,
    duration: "1–2 days",
    price: "Quote",
    icon: Award,
  }));
}

// ── Form state ───────────────────────────────────────────────
export interface BookingState {
  service: ServiceKey | null;
  packageId: string;
  serviceDetails: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleReg: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  purpose: "book" | "quote";
}

export const INITIAL: BookingState = {
  service: null,
  packageId: "",
  serviceDetails: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleReg: "",
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  purpose: "book",
};

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  detailing: "Detailing",
  tints: "Window Tint",
  repairs: "Repair",
};

export type UpdateFn = <K extends keyof BookingState>(
  field: K,
  value: BookingState[K]
) => void;
