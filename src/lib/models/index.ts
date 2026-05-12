import { Db, Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";
import {
  CarInterface,
  ServiceAppointment,
  CarViewingBooking,
  ShopInfo,
  AdminUser,
  Quote,
  DetailingPackage,
  TintOption,
  ServiceOverview,
  RecoveryInfo,
  CarPartInterface,
  Reservation,
  PartExchange,
} from "@/lib/interfaces";

// Re-export interfaces for backward compatibility
export type {
  CarInterface,
  ServiceAppointment,
  CarViewingBooking,
  ShopInfo,
  AdminUser,
  Quote,
  CarPartInterface,
  Reservation,
  PartExchange,
};

// ── Cached collection handles ────────────────────────────────
let carsCollection: Collection<CarInterface>;
let featuredCar: CarInterface | null;
let featuredCarExpiry: number = 0;
let serviceAppointmentsCollection: Collection<ServiceAppointment>;
let carViewingBookingsCollection: Collection<CarViewingBooking>;
let businessInfoCollection: Collection<ShopInfo>;
let adminUsersCollection: Collection<AdminUser>;
let quotesCollection: Collection<Quote>;
let detailingPackagesCollection: Collection<DetailingPackage>;
let tintOptionsCollection: Collection<TintOption>;
let serviceOverviewsCollection: Collection<ServiceOverview>;
let recoveryInfoCollection: Collection<RecoveryInfo>;
let carPartsCollection: Collection<CarPartInterface>;
let reservationsCollection: Collection<Reservation>;
let partExchangesCollection: Collection<PartExchange>;

// Helper function to convert ObjectId and Date fields to strings
export function serializeDocument<T>(doc: T): T {
  if (!doc || typeof doc !== "object") return doc;

  const serialized = { ...doc } as Record<string, unknown>;

  for (const key of Object.keys(serialized)) {
    const value = serialized[key];
    if (value && typeof value === "object") {
      // Check if it's an ObjectId (has toHexString method)
      if ("toHexString" in value && typeof value.toHexString === "function") {
        serialized[key] = value.toHexString();
      }
      // Check if it's a Date
      else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      }
      // Recursively handle nested objects
      else if (!Array.isArray(value)) {
        serialized[key] = serializeDocument(value);
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        serialized[key] = value.map((item) =>
          typeof item === "object" ? serializeDocument(item) : item
        );
      }
    }
  }

  return serialized as T;
}

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db("MMC");
}

const FEATURED_CAR_TTL = 5 * 60 * 1000; // 5 minutes

export async function getFeaturedCar(): Promise<CarInterface | null> {
  if (featuredCar && Date.now() < featuredCarExpiry) return featuredCar;

  const cars = await getCarsCollection();
  const car = await cars.findOne({ featured: true });
  featuredCar = car ? (serializeDocument(car) as CarInterface) : null;
  featuredCarExpiry = Date.now() + FEATURED_CAR_TTL;
  return featuredCar;
}

export async function getCarsCollection(): Promise<Collection<CarInterface>> {
  if (!carsCollection) {
    const db = await getDb();
    carsCollection = db.collection<CarInterface>("cars");

    await carsCollection.createIndexes([
      { key: { status: 1 } },
      { key: { make: 1, model: 1 } },
      { key: { featured: 1 } },
      { key: { price: 1 } },
      { key: { year: -1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { status: 1, price: 1 } },
      { key: { make: 1, status: 1 } },
    ]);
  }
  return carsCollection;
}

export async function getServiceAppointmentsCollection(): Promise<
  Collection<ServiceAppointment>
> {
  if (!serviceAppointmentsCollection) {
    const db = await getDb();
    serviceAppointmentsCollection = db.collection<ServiceAppointment>(
      "serviceAppointments"
    );

    await serviceAppointmentsCollection.createIndexes([
      { key: { bookingReference: 1 }, unique: true },
      { key: { "customerInfo.email": 1 } },
      { key: { status: 1 } },
      { key: { appointmentDate: 1, status: 1 } },
      { key: { status: 1, createdAt: -1 } },
      // Compound index for cron review-invite query
      {
        key: { status: 1, completedAt: 1, reviewInviteSentAt: 1 },
      },
      // Slot uniqueness for active service bookings.
      // (CODEBASE_ISSUES C3.) The partial filter scopes the constraint to
      // bookings still on the calendar — cancelled and completed bookings
      // don't block the slot from being rebooked.
      {
        key: { appointmentDate: 1, appointmentTime: 1 },
        unique: true,
        partialFilterExpression: {
          status: { $in: ["pending", "confirmed"] },
        },
        name: "uniq_active_service_slot",
      },
    ]);
  }
  return serviceAppointmentsCollection;
}

export async function getCarViewingBookingsCollection(): Promise<
  Collection<CarViewingBooking>
> {
  if (!carViewingBookingsCollection) {
    const db = await getDb();
    carViewingBookingsCollection =
      db.collection<CarViewingBooking>("carViewingBookings");

    await carViewingBookingsCollection.createIndexes([
      { key: { bookingReference: 1 }, unique: true },
      { key: { "customerInfo.email": 1 } },
      { key: { status: 1 } },
      { key: { carId: 1 } },
      { key: { appointmentDate: 1, status: 1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { carId: 1, status: 1 } },
      // Compound index for cron review-invite query
      {
        key: { status: 1, completedAt: 1, reviewInviteSentAt: 1 },
      },
      // Slot uniqueness for active viewing bookings on a specific car.
      // (CODEBASE_ISSUES C3.) Scoped by status so cancelled/completed
      // bookings don't permanently lock a slot.
      {
        key: { carId: 1, appointmentDate: 1, appointmentTime: 1 },
        unique: true,
        partialFilterExpression: {
          status: { $in: ["pending", "confirmed"] },
        },
        name: "uniq_active_viewing_slot",
      },
    ]);
  }
  return carViewingBookingsCollection;
}

// ── Business Info (core fields only – packages live in their own collections) ──
export async function getBusinessInfoCollection(): Promise<
  Collection<ShopInfo>
> {
  if (!businessInfoCollection) {
    const db = await getDb();
    businessInfoCollection = db.collection<ShopInfo>("businessInfo");
  }
  return businessInfoCollection;
}

// ── Split service collections ────────────────────────────────
export async function getDetailingPackagesCollection(): Promise<
  Collection<DetailingPackage>
> {
  if (!detailingPackagesCollection) {
    const db = await getDb();
    detailingPackagesCollection =
      db.collection<DetailingPackage>("detailingPackages");
  }
  return detailingPackagesCollection;
}

export async function getTintOptionsCollection(): Promise<
  Collection<TintOption>
> {
  if (!tintOptionsCollection) {
    const db = await getDb();
    tintOptionsCollection = db.collection<TintOption>("tintOptions");
  }
  return tintOptionsCollection;
}

export async function getServiceOverviewsCollection(): Promise<
  Collection<ServiceOverview>
> {
  if (!serviceOverviewsCollection) {
    const db = await getDb();
    serviceOverviewsCollection =
      db.collection<ServiceOverview>("serviceOverviews");
  }
  return serviceOverviewsCollection;
}

export async function getRecoveryInfoCollection(): Promise<
  Collection<RecoveryInfo>
> {
  if (!recoveryInfoCollection) {
    const db = await getDb();
    recoveryInfoCollection = db.collection<RecoveryInfo>("recoveryInfo");
  }
  return recoveryInfoCollection;
}

// ── Admin Users ──────────────────────────────────────────────
export async function getAdminUsersCollection(): Promise<
  Collection<AdminUser>
> {
  if (!adminUsersCollection) {
    const db = await getDb();
    adminUsersCollection = db.collection<AdminUser>("adminUsers");

    await adminUsersCollection.createIndexes([
      { key: { username: 1 }, unique: true },
      // Sparse so existing rows without an email don't block creation.
      // Unique so concurrent POSTs can't create two admins with the same
      // email. (CODEBASE_ISSUES C7.)
      { key: { email: 1 }, unique: true, sparse: true },
    ]);
  }
  return adminUsersCollection;
}

// ── Quotes ───────────────────────────────────────────────────
export async function getQuotesCollection(): Promise<Collection<Quote>> {
  if (!quotesCollection) {
    const db = await getDb();
    quotesCollection = db.collection<Quote>("quotes");

    await quotesCollection.createIndexes([
      { key: { quoteReference: 1 }, unique: true },
      { key: { "customerInfo.email": 1 } },
      { key: { status: 1 } },
    ]);
  }
  return quotesCollection;
}

// ── Car Parts ────────────────────────────────────────────────
export async function getCarPartsCollection(): Promise<
  Collection<CarPartInterface>
> {
  if (!carPartsCollection) {
    const db = await getDb();
    carPartsCollection = db.collection<CarPartInterface>("carParts");

    await carPartsCollection.createIndexes([
      { key: { category: 1 } },
      { key: { brand: 1 } },
      { key: { condition: 1 } },
      { key: { price: 1 } },
    ]);
  }
  return carPartsCollection;
}

// ── Reservations (#30) ───────────────────────────────────────
export async function getReservationsCollection(): Promise<
  Collection<Reservation>
> {
  if (!reservationsCollection) {
    const db = await getDb();
    reservationsCollection = db.collection<Reservation>("reservations");

    await reservationsCollection.createIndexes([
      { key: { reservationReference: 1 }, unique: true },
      { key: { carId: 1 } },
      { key: { status: 1 } },
      { key: { "customerInfo.email": 1 } },
      { key: { status: 1, createdAt: -1 } },
      // Auto-expire pending reservations via TTL on expiresAt.
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      // Only one active (pending/confirmed) reservation per car at a time.
      {
        key: { carId: 1 },
        unique: true,
        partialFilterExpression: {
          status: { $in: ["pending", "confirmed"] },
        },
        name: "uniq_active_reservation_per_car",
      },
    ]);
  }
  return reservationsCollection;
}

// ── Part Exchange enquiries (#31) ────────────────────────────
export async function getPartExchangesCollection(): Promise<
  Collection<PartExchange>
> {
  if (!partExchangesCollection) {
    const db = await getDb();
    partExchangesCollection =
      db.collection<PartExchange>("partExchanges");

    await partExchangesCollection.createIndexes([
      { key: { enquiryReference: 1 }, unique: true },
      { key: { status: 1 } },
      { key: { "customerInfo.email": 1 } },
      { key: { status: 1, createdAt: -1 } },
    ]);
  }
  return partExchangesCollection;
}
