// jest.setup.js - API tests setup with MongoDB
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");

// Mock @vercel/functions for testing
// - waitUntil: no-op (the IIFE promise runs anyway); use flushWaitUntil() in
//   tests that need to assert on background work.
// - ipAddress: extracts the first IP from x-forwarded-for, mirroring Vercel.
jest.mock("@vercel/functions", () => ({
  waitUntil: jest.fn(),
  ipAddress: jest.fn(
    (req) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
  ),
}));

// Mock @/backend/mongodb to use a lazy connection that defers until
// MONGODB_URI is available (set in beforeAll after MongoMemoryServer starts)
jest.mock("@/backend/mongodb", () => {
  const { MongoClient } = require("mongodb");
  let cachedClientPromise = null;

  const lazyClientPromise = {
    then(onFulfilled, onRejected) {
      if (!cachedClientPromise) {
        const client = new MongoClient(process.env.MONGODB_URI);
        cachedClientPromise = client.connect();
      }
      return cachedClientPromise.then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return this.then(undefined, onRejected);
    },
  };

  return { __esModule: true, default: lazyClientPromise };
});

// Global test setup
let mongod;
let mongoUri;

beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  mongoUri = mongod.getUri();

  // Set test environment variables
  process.env.MONGODB_URI = mongoUri;
  process.env.NODE_ENV = "test";
  process.env.SESSION_SECRET =
    "test-session-secret-at-least-32-characters-long";
  process.env.ADMIN_PASSWORD = "test-admin-password";
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.EMAIL_FROM = "test@example.com";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.NEXT_BUSINESS_NAME = "Test Motor Company";
  process.env.NEXT_BUSINESS_PHONE = "555-123-4567";
  process.env.NEXT_BUSINESS_EMAIL = "test@testmotor.com";
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});

// Clear collections between tests
beforeEach(async () => {
  if (mongoUri) {
    const client = new MongoClient(mongoUri);
    await client.connect();
    // Clean MMC database (main app data)
    const mmcDb = client.db("MMC");
    const mmcCollections = await mmcDb.listCollections().toArray();
    for (const collection of mmcCollections) {
      await mmcDb.collection(collection.name).deleteMany({});
    }
    // Clean Venue database (business info)
    const venueDb = client.db("Venue");
    const venueCollections = await venueDb.listCollections().toArray();
    for (const collection of venueCollections) {
      await venueDb.collection(collection.name).deleteMany({});
    }
    await client.close();
  }
});
