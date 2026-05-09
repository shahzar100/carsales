// jest.env.setup.js
//
// Loaded via Jest's `setupFiles` — runs BEFORE any test module is imported,
// before the test framework is loaded. Pre-populates `process.env` so that
// `src/lib/env.ts` (which validates with Zod at module load) doesn't throw
// when modules that depend on it are imported by test files.
//
// Real values are then overridden in `jest.setup.js` `beforeAll` for the
// API test suite (e.g. MongoMemoryServer URI).

process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jest-placeholder";
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "test-session-secret-at-least-32-characters-long";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "test-admin-password";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test-resend-key";
process.env.EMAIL_FROM = process.env.EMAIL_FROM || "test@example.com";
process.env.NEXT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
process.env.NEXT_PUBLIC_BUSINESS_NAME =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Test Motor Company";
process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
process.env.NEXT_BUSINESS_NAME =
  process.env.NEXT_BUSINESS_NAME || "Test Motor Company";
process.env.NEXT_BUSINESS_PHONE =
  process.env.NEXT_BUSINESS_PHONE || "555-123-4567";
process.env.NEXT_BUSINESS_EMAIL =
  process.env.NEXT_BUSINESS_EMAIL || "test@testmotor.com";
