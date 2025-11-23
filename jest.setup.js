// jest.setup.js
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

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

  // Business environment variables
  process.env.NEXT_BUSINESS_NAME = "Test Motor Company";
  process.env.NEXT_BUSINESS_ADDRESS = "Test Street 123";
  process.env.NEXT_BUSINESS_CITY = "Test City";
  process.env.NEXT_BUSINESS_STATE = "Test State";
  process.env.NEXT_BUSINESS_ZIP = "12345";
  process.env.NEXT_BUSINESS_PHONE = "555-123-4567";
  process.env.NEXT_BUSINESS_EMAIL = "test@testmotor.com";
});

afterAll(async () => {
  // Clean up
  if (mongod) {
    await mongod.stop();
  }
});

// Clear collections between tests
beforeEach(async () => {
  if (mongoUri) {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db("carsales");

    // Clear all collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }

    await client.close();
  }
});
