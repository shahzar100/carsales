// Day 7 / Fix 7.3: this file used to declare types alongside @/lib/interfaces,
// which split the source of truth between two paths. It is now a thin
// re-export shim — every type below lives in `interfaces.ts`.
//
// New code should import from `@/lib/interfaces` directly. This file can
// be deleted once the existing `@/lib/types` import sites are migrated.

export type {
  CarInterface as Car,
  CarInterface,
  ServiceAppointment,
  CarViewingBooking,
  ShopInfo,
  Booking,
  Notification,
  ActiveTab,
  SelectedBooking,
} from "./interfaces";
