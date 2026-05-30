/**
 * One-time migration script to update the businessInfo collection
 * in MongoDB with the correct MMC Leeds business details.
 *
 * Usage: npx tsx scripts/migrate-business-info.ts
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually to avoid dotenv dependency
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // The application reads from db("MMC") (see src/lib/models/index.ts).
    // Defaulting to client.db() picks the database from the connection
    // string path, which may not match. Pin to "MMC" explicitly so the
    // migration writes where the app reads.
    const db = client.db("MMC");
    const collection = db.collection("businessInfo");

    const result = await collection.updateOne(
      {},
      {
        $set: {
          businessName: "MMC Leeds",
          address: "Roseville Road",
          city: "Leeds",
          state: "West Yorkshire",
          zipCode: "LS8 5DT",
          phone: "0113 468 9292",
          email: "info@mmcleeds.co.uk",
          bookingsEmail: "bookings@mmcleeds.co.uk",
          googleMapsUrl:
            "https://maps.google.com/?q=Roseville+Road,+Leeds,+LS8+5DT",
          description:
            "Browse our premium car collection with convenient viewing and booking services.",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(
        "✅ Inserted new businessInfo document with MMC Leeds details"
      );
    } else if (result.modifiedCount > 0) {
      console.log(
        "✅ Updated existing businessInfo document with MMC Leeds details"
      );
    } else {
      console.log("ℹ️  No changes needed — document already up to date");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("✅ Disconnected from MongoDB");
  }
}

migrate();
