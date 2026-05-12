import { MongoClient } from "mongodb";

import { serverEnv } from "@/lib/env";

/**
 * MongoDB connection optimised for Vercel serverless functions.
 *
 * In serverless environments each invocation may spin up a new
 * process, but the Node.js runtime is often reused ("warm start").
 * Caching the connection promise on `globalThis` ensures we
 * re-use the same connection across warm invocations instead of
 * opening a new pool every time.
 *
 * This pattern is used in BOTH development and production.
 *
 * `MONGODB_URI` is read via the validated `serverEnv` so an invalid
 * or missing value fails at boot time (in `instrumentation.ts`) with
 * a clear error rather than crashing here on first request.
 *
 * (#1) Previously this lived in `src/backend/mongodb.ts`, which was a
 * fork of the same idea split across two directories. Consolidated here
 * so there's one canonical connection module.
 */

const uri = serverEnv.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Cache the promise on globalThis so it survives across
// serverless warm starts in both dev and production.
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect().catch((err: unknown) => {
    console.error("[MongoDB] Initial connection failed:", err);
    global._mongoClientPromise = undefined;
    throw err;
  });
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

export default clientPromise;
