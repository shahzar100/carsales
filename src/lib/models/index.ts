import { Db, Collection } from "mongodb";
import clientPromise from "@/backend/mongodb";
import {
  CarInterface,
  ServiceAppointment,
  CarViewingBooking,
  ShopInfo,
  AdminUser,
  Quote,
} from "@/lib/interfaces";

// Re-export interfaces for backward compatibility
export type {
  CarInterface,
  ServiceAppointment,
  CarViewingBooking,
  ShopInfo,
  AdminUser,
  Quote,
};

let carsCollection: Collection<CarInterface>;
let featuredCar: CarInterface | null;
let serviceAppointmentsCollection: Collection<ServiceAppointment>;
let carViewingBookingsCollection: Collection<CarViewingBooking>;
let shopInfoCollection: Collection<ShopInfo>;
let adminUsersCollection: Collection<AdminUser>;
let quotesCollection: Collection<Quote>;

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

async function getDb(name: string = "MMC"): Promise<Db> {
  const client = await clientPromise;
  return client.db(name);
}

export async function getFeaturedCar(): Promise<CarInterface | null> {
  if (featuredCar) return featuredCar;

  const cars = await getCarsCollection();
  const car = await cars.findOne({ featured: true });
  featuredCar = car ? (serializeDocument(car) as CarInterface) : null;
  return featuredCar;
}

export async function getCarsCollection(): Promise<Collection<CarInterface>> {
  if (!carsCollection) {
    const db = await getDb();
    //not featured car
    carsCollection = db.collection<CarInterface>("cars");

    // Create indexes
    await carsCollection.createIndex({ status: 1 });
    await carsCollection.createIndex({ make: 1, model: 1 });
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

    // Create indexes
    await serviceAppointmentsCollection.createIndex(
      { bookingReference: 1 },
      { unique: true }
    );
    await serviceAppointmentsCollection.createIndex({
      "customerInfo.email": 1,
    });
    await serviceAppointmentsCollection.createIndex({ status: 1 });
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

    // Create indexes
    await carViewingBookingsCollection.createIndex(
      { bookingReference: 1 },
      { unique: true }
    );
    await carViewingBookingsCollection.createIndex({ "customerInfo.email": 1 });
    await carViewingBookingsCollection.createIndex({ status: 1 });
  }
  return carViewingBookingsCollection;
}

export async function getBussinessInfoCollection(): Promise<
  Collection<ShopInfo>
> {
  if (!shopInfoCollection) {
    const db = await getDb("Venue");
    shopInfoCollection = db.collection<ShopInfo>("MMC_Leeds");
  }
  return shopInfoCollection;
}

// Alias for backwards compatibility
export const getShopInfoCollection = getBussinessInfoCollection;

export async function getAdminUsersCollection(): Promise<
  Collection<AdminUser>
> {
  if (!adminUsersCollection) {
    const db = await getDb();
    adminUsersCollection = db.collection<AdminUser>("adminUsers");

    // Create indexes
    await adminUsersCollection.createIndex({ username: 1 }, { unique: true });
  }
  return adminUsersCollection;
}

export async function getQuotesCollection(): Promise<Collection<Quote>> {
  if (!quotesCollection) {
    const db = await getDb();
    quotesCollection = db.collection<Quote>("quotes");

    // Create indexes
    await quotesCollection.createIndex({ quoteReference: 1 }, { unique: true });
    await quotesCollection.createIndex({ "customerInfo.email": 1 });
    await quotesCollection.createIndex({ status: 1 });
  }
  return quotesCollection;
}
