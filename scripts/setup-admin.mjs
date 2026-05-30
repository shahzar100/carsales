/**
 * One-time admin bootstrap script.
 *
 * Reads admin credentials from the environment and upserts an admin row
 * into the `adminUsers` collection so the app has a working login on
 * first boot.
 *
 * Usage (local):
 *   ADMIN_USERNAME=admin \
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD='change-me-then-rotate' \
 *   node scripts/setup-admin.mjs
 *
 * Or simply set those values in `.env.local` and run `node scripts/setup-admin.mjs`
 * — this script will read `.env.local` if the env vars aren't already set.
 *
 * Idempotent: re-running with the same values is a no-op (`upsert` writes
 * the same hash, password is re-hashed each time so the row updates but
 * the credentials don't change).
 */

import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";

// ── Read .env.local if env vars aren't already set ──────────────
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Add it to .env.local and retry.");
  process.exit(1);
}
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error(
    "❌ ADMIN_PASSWORD must be set and at least 8 characters long. " +
      "Add it to .env.local or pass it inline:\n" +
      "   ADMIN_PASSWORD='your-strong-password' node scripts/setup-admin.mjs"
  );
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // Pin to "MMC" — that's the database the app reads from.
    // (See src/lib/models/index.ts.)
    const db = client.db("MMC");
    const collection = db.collection("adminUsers");

    // Match cost factor with the runtime hashPassword (src/lib/utils/auth.ts).
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const result = await collection.updateOne(
      { username: ADMIN_USERNAME },
      {
        $set: {
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          passwordHash,
          role: "admin",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`✅ Created admin user "${ADMIN_USERNAME}"`);
    } else {
      console.log(`✅ Updated admin user "${ADMIN_USERNAME}"`);
    }
    console.log("   Email: " + ADMIN_EMAIL);
    console.log("   Login at: /admin/login");
  } catch (err) {
    console.error("❌ Setup failed:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
