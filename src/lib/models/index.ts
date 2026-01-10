import { Db, Collection } from "mongodb";
import clientPromise from "@/backend/mongodb";
import {
  CarInterface,
  ServiceAppointment,
  CarViewingBooking,
  ShopInfo,
  AdminUser,
} from "@/lib/interfaces";

// Re-export interfaces for backward compatibility
export type { CarInterface, ServiceAppointment, CarViewingBooking, ShopInfo, AdminUser };

let carsCollection: Collection<CarInterface>;
let serviceAppointmentsCollection: Collection<ServiceAppointment>;
let carViewingBookingsCollection: Collection<CarViewingBooking>;
let shopInfoCollection: Collection<ShopInfo>;
let adminUsersCollection: Collection<AdminUser>;

async function getDb(name: string = "MMC"): Promise<Db> {
  const client = await clientPromise;
  return client.db(name);
}

export async function getCarsCollection(): Promise<Collection<CarInterface>> {
  if (!carsCollection) {
    const db = await getDb();
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

export async function getBussinessInfoCollection(): Promise<Collection<ShopInfo>> {
  if (!shopInfoCollection) {
    const db = await getDb("Venue");
    shopInfoCollection = db.collection<ShopInfo>("MMC_Leeds");
  }
  return shopInfoCollection;
}

export async function getAdminUsersCollection(): Promise<
  Collection<AdminUser>
> {
  if (!adminUsersCollection) {
    const db = await getDb();
    adminUsersCollection = db.collection<AdminUser>("admUsers");

    // Create indexes
    await adminUsersCollection.createIndex({ username: 1 }, { unique: true });
  }
  return adminUsersCollection;
}
