// `_id` was previously declared as `string` even though
// MongoDB stores it as `ObjectId`. The widened type below removes the need
// for `as unknown as Parameters<...>` casts at every read/update site.
// `serializeDocument` (src/lib/models/index.ts) converts ObjectId → string
// before responses leave the API boundary, so client consumers still see
// a string at runtime.
import type { ObjectId } from "mongodb";

export interface CarInterface {
  _id?: string | ObjectId;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: "Petrol" | "Diesel" | "Electric" | "Hybrid";
  transmission: "Manual" | "Automatic" | "CVT";
  doors: number;
  colour: string;
  image?: string; // URL/path to main image
  images?: string[]; // Array of image URLs/paths
  description?: string;
  features?: string[];
  status: "available" | "sold" | "reserved";
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
}

export interface ServiceAppointment {
  _id?: string | ObjectId;
  bookingReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  serviceType: string;
  serviceDetails?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  reviewInviteSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarViewingBooking {
  _id?: string | ObjectId;
  bookingReference: string;
  carId: string;
  carDetails: {
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  // Dealership is single-location for now and populated server-side from
  // businessInfo (Day 12.7). Stays optional on the read type to tolerate
  // legacy documents written before the auto-default landed.
  dealership?: {
    location: string;
    address: string;
  };
  status: "pending" | "confirmed" | "completed" | "cancelled";
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  reviewInviteSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface DetailingPackage {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceInPence?: number;
  duration: string;
  description: string;
  exteriorFeatures: string[];
  interiorFeatures: string[];
  popular: boolean;
  includesPrevious: string | null;
}

export interface TintOption {
  name: string;
  type: string;
  price: string;
  priceMinInPence?: number;
  priceMaxInPence?: number;
  vlt: string;
  warranty: string;
  description: string;
  features: string[];
  popular: boolean;
}

export interface RecoveryPricingTier {
  name: string;
  price: string;
  distance: string;
}

export interface RecoveryInfo {
  coverageAreas: string[];
  pricingTiers: RecoveryPricingTier[];
  responseTime: string;
}

export interface ServiceOverview {
  id: string;
  title: string;
  subtitle: string;
  priceRange: string;
  duration: string;
  features: string[];
}

export interface ShopInfo {
  _id?: string | ObjectId;
  // Core business info
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  bookingsEmail?: string;
  googleMapsUrl?: string;
  hours: BusinessHours;
  description?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };

  // Hero section stats
  heroStats?: {
    vehicles: HeroStat;
    booking: HeroStat;
    rating: HeroStat;
  };

  // Service packages
  detailingPackages?: DetailingPackage[];
  tintOptions?: TintOption[];
  serviceOverviews?: ServiceOverview[];

  // Recovery / Breakdown
  recovery?: RecoveryInfo;

  updatedAt: Date;
}

export interface AdminUser {
  _id?: string | ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: "staff" | "manager" | "admin";
  createdAt: Date;
  lastLogin?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  updatedAt?: Date;
  // 2FA (Day 12.2). Opt-in per user; absent means 2FA is off.
  totpSecret?: string;
  totpEnabled?: boolean;
}

/**
 * Customer account — distinct from `AdminUser`. Stored in the `users`
 * collection, which is also managed by the Auth.js MongoDB adapter
 * (the adapter owns `name`, `email`, `emailVerified`, `image` and the
 * sibling `accounts` / `sessions` / `verification_tokens` collections).
 *
 * Fields we own on top of the adapter schema:
 *   - `password`           bcrypt hash, present only for credentials
 *                          sign-ups. OAuth / magic-link users never
 *                          have one.
 *   - `savedCarIds`        server-persisted wishlist, synced from the
 *                          localStorage-backed SavedCarsContext.
 *   - `resetToken` /       SHA-256 hash of the password-reset token and
 *     `resetTokenExpiry`   its expiry. Set by /api/auth/forgot-password,
 *                          cleared on use. Mirrors the AdminUser flow.
 *   - `verifyToken` /      SHA-256 hash of the email-verification token
 *     `verifyTokenExpiry`  and its expiry. Set on credentials sign-up
 *                          and on resend; cleared once `emailVerified`
 *                          is stamped. OAuth / magic-link users skip
 *                          this entirely — the provider proves the
 *                          email, so the adapter sets `emailVerified`.
 *
 * Customer auth never touches `AdminUser` / `adminUsers`, so a customer
 * account can never escalate into the admin dashboard.
 */
export interface CustomerUser {
  _id?: string | ObjectId;
  name?: string;
  email: string;
  emailVerified?: Date | null;
  image?: string;
  password?: string;
  savedCarIds?: string[];
  resetToken?: string;
  resetTokenExpiry?: Date;
  verifyToken?: string;
  verifyTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Quote {
  _id?: string | ObjectId;
  quoteReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  serviceType: string;
  serviceDetails?: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    registration?: string;
  };
  status: "pending" | "responded" | "accepted" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

export interface CarPartInterface {
  _id?: string | ObjectId;
  name: string;
  brand: string;
  category: string;
  price: number;
  image?: string;
  condition: "New" | "Used" | "Refurbished";
  compatibility: string;
  description: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * (#30) Reservation — customer reserves a car online and brings cash
 * to the showroom to confirm. Captures high-intent leads without
 * payment infrastructure.
 */
export interface Reservation {
  _id?: string | ObjectId;
  reservationReference: string;
  carId: string;
  carDetails: {
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  /** Status moves: pending → confirmed (deposit paid) → cancelled/expired. */
  status: "pending" | "confirmed" | "cancelled" | "expired";
  /** Notes from the customer ("I'll be in tomorrow afternoon", etc.). */
  notes?: string;
  /** When the reservation auto-expires if no deposit is taken. */
  expiresAt: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * (#31) Part-exchange enquiry — customer's current car details, used
 * by the sales team to come back with a valuation.
 */
export interface PartExchange {
  _id?: string | ObjectId;
  enquiryReference: string;
  /** Which listing they were viewing when they enquired (optional). */
  interestedInCarId?: string;
  interestedInCarLabel?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  vehicle: {
    registration?: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    condition: "Excellent" | "Good" | "Fair" | "Poor";
    serviceHistory?: "Full" | "Partial" | "None";
    notes?: string;
  };
  status: "pending" | "valued" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
}


// ───────────────────────────────────────────────────────────────
// UI / admin-dashboard types (moved from src/lib/types.ts in Day 7).
// `types.ts` is now a thin re-export shim that also keeps the
// `Car` alias for older import sites.
// ───────────────────────────────────────────────────────────────

export interface Booking {
  _id: string;
  bookingReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  serviceType?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

export interface Notification {
  type: "success" | "error";
  message: string;
}

export type ActiveTab = "cars" | "service" | "viewing" | "shop";

export interface SelectedBooking {
  booking: Booking;
  type: string;
}

// ───────────────────────────────────────────────────────────────
// Audit log (Day 10 / Fix 10.1 groundwork)
//
// Every state-changing admin action should call recordAudit() with the
// actor (session.username), an action verb (`car.create`, `car.update`,
// `booking.cancel`, `user.create`, etc.), the targetType + targetId, and
// any extra metadata the operator might want to grep for during forensics.
// ───────────────────────────────────────────────────────────────

export interface AuditLog {
  _id?: string | ObjectId;
  actor: string;
  action: string;
  targetType:
    | "car"
    | "carPart"
    | "user"
    | "booking"
    | "viewing"
    | "reservation"
    | "partExchange"
    | "quote"
    | "shop"
    | "other";
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
