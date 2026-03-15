// Test utilities for API testing
import { NextRequest } from "next/server";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

/**
 * Flush all promises passed to waitUntil() so background work
 * (e.g. email sends) completes before assertions run.
 */
export const flushWaitUntil = async () => {
  const { waitUntil } = require("@vercel/functions");
  const calls: [Promise<unknown>][] = waitUntil.mock.calls;
  await Promise.all(
    calls.map(([promise]: [Promise<unknown>]) =>
      Promise.resolve(promise).catch(() => {})
    )
  );
};

// Mock email sending for testing
export const mockSendEmail = jest.fn().mockResolvedValue({ success: true });

jest.mock("@/emails/send", () => ({
  sendEmail: mockSendEmail,
}));

// Test data factories
export const createTestCar = (overrides = {}) => ({
  make: "Toyota",
  model: "Camry",
  year: 2023,
  price: 25000,
  mileage: 15000,
  fuel: "Petrol",
  transmission: "Automatic",
  doors: 4,
  colour: "White",
  status: "available",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestServiceAppointment = (overrides = {}) => ({
  bookingReference: "BK-TEST01",
  customerInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "555-0123",
  },
  serviceType: "Oil Change",
  serviceDetails: "Regular oil change service",
  appointmentDate: "2024-12-25",
  appointmentTime: "10:00 AM",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestCarViewingBooking = (overrides = {}) => ({
  bookingReference: "BK-TEST02",
  carId: "507f1f77bcf86cd799439011",
  carDetails: {
    make: "Toyota",
    model: "Camry",
    year: 2023,
    price: 25000,
    image: "test-image.jpg",
  },
  customerInfo: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "555-0124",
  },
  appointmentDate: "2024-12-26",
  appointmentTime: "2:00 PM",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestShopInfo = (overrides = {}) => ({
  businessName: "Test Motor Company",
  address: "Test Street 123",
  city: "Test City",
  state: "Test State",
  zipCode: "12345",
  phone: "555-123-4567",
  email: "test@testmotor.com",
  hours: {
    monday: "9:00 AM - 6:00 PM",
    tuesday: "9:00 AM - 6:00 PM",
    wednesday: "9:00 AM - 6:00 PM",
    thursday: "9:00 AM - 6:00 PM",
    friday: "9:00 AM - 6:00 PM",
    saturday: "10:00 AM - 4:00 PM",
    sunday: "Closed",
  },
  description: "Test dealership",
  socialMedia: {
    facebook: "test-facebook",
    twitter: "test-twitter",
    instagram: "test-instagram",
  },
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create admin user
export const createTestAdminUser = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db("MMC");

  const passwordHash = await bcrypt.hash("test-admin-password", 10);
  const adminUser = {
    username: "testadmin",
    passwordHash,
    createdAt: new Date(),
  };

  await db.collection("adminUsers").insertOne(adminUser);
  await client.close();

  return adminUser;
};

// Helper to create authenticated request
export const createAuthenticatedRequest = async (
  method: string,
  url: string,
  body?: Record<string, unknown>
) => {
  // Mock iron-session for authenticated requests
  const mockSession = {
    adminId: "test-admin-id",
    username: "testadmin",
  };

  // Mock the auth utility
  jest.doMock("@/lib/utils/auth", () => ({
    isAuthenticated: jest.fn().mockResolvedValue(true),
    getSession: jest.fn().mockResolvedValue(mockSession),
  }));

  const headers = new Headers();
  if (body) {
    headers.set("Content-Type", "application/json");
  }

  return new NextRequest(
    new Request(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  );
};

// Helper to create unauthenticated request
export const createUnauthenticatedRequest = (
  method: string,
  url: string,
  body?: Record<string, unknown>
) => {
  // Mock the auth utility to return false
  jest.doMock("@/lib/utils/auth", () => ({
    isAuthenticated: jest.fn().mockResolvedValue(false),
    getSession: jest.fn().mockResolvedValue(null),
  }));

  const headers = new Headers();
  if (body) {
    headers.set("Content-Type", "application/json");
  }

  return new NextRequest(
    new Request(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  );
};

// Helper to seed database with test data
export const seedDatabase = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db("MMC");

  // Add test car
  await db.collection("cars").insertOne(createTestCar());

  // Add test shop info
  await db.collection("businessInfo").insertOne(createTestShopInfo());

  // Add test service appointment
  await db
    .collection("serviceAppointments")
    .insertOne(createTestServiceAppointment());

  // Add test car viewing booking
  await db
    .collection("carViewingBookings")
    .insertOne(createTestCarViewingBooking());

  await client.close();
};

// Helper to get database collections for testing
export const getTestCollections = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db("MMC");

  return {
    cars: db.collection("cars"),
    shopInfo: db.collection("businessInfo"),
    detailingPackages: db.collection("detailingPackages"),
    tintOptions: db.collection("tintOptions"),
    serviceOverviews: db.collection("serviceOverviews"),
    recoveryInfo: db.collection("recoveryInfo"),
    serviceAppointments: db.collection("serviceAppointments"),
    carViewingBookings: db.collection("carViewingBookings"),
    adminUsers: db.collection("adminUsers"),
    quotes: db.collection("quotes"),
    client, // Return client so tests can close it
  };
};
