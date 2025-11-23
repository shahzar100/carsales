import { Db, Collection } from "mongodb";
import clientPromise from "@/backend/mongodb";

export interface Car {
  _id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  doors: number;
  colour: string;
  image?: string;
  images?: string[];
  description?: string;
  features?: string[];
  status: "available" | "sold" | "reserved";
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAppointment {
  _id?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CarViewingBooking {
  _id?: string;
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
  dealership?: {
    location: string;
    address: string;
  };
  status: "pending" | "confirmed" | "completed" | "cancelled";
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopInfo {
  _id?: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  description?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  updatedAt: Date;
}

export interface AdminUser {
  _id?: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

let carsCollection: Collection<Car>;
let serviceAppointmentsCollection: Collection<ServiceAppointment>;
let carViewingBookingsCollection: Collection<CarViewingBooking>;
let shopInfoCollection: Collection<ShopInfo>;
let adminUsersCollection: Collection<AdminUser>;

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db("carsales");
}

export async function getCarsCollection(): Promise<Collection<Car>> {
  if (!carsCollection) {
    const db = await getDb();
    carsCollection = db.collection<Car>("cars");

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

export async function getShopInfoCollection(): Promise<Collection<ShopInfo>> {
  if (!shopInfoCollection) {
    const db = await getDb();
    shopInfoCollection = db.collection<ShopInfo>("shopInfo");
  }
  return shopInfoCollection;
}

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
