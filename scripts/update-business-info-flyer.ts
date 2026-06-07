/**
 * One-time migration: align the businessInfo + serviceOverviews collections
 * in MongoDB with the MMC Leeds marketing flyer.
 *
 * - Core: flyer phone, WhatsApp number, opening hours, and social handles.
 * - Service overviews: rename Tints (now "& Car Wrapping") and Repairs, and
 *   add Vehicle Modifications + Brand New Tyres so /Services lists all the
 *   workshop services the flyer advertises.
 *
 * The in-file seeds (src/lib/utils/businessInfo.ts) already carry these
 * values, but seeds only apply on a first-ever read. Production is already
 * seeded, so this script applies them to the live documents.
 *
 * Usage: npx tsx scripts/update-business-info-flyer.ts
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually to avoid a dotenv dependency.
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

const CORE = {
  phone: "0113 548 4182",
  whatsapp: "0796 628 1510",
  hours: {
    monday: "9:00 AM - 6:00 PM",
    tuesday: "9:00 AM - 6:00 PM",
    wednesday: "9:00 AM - 6:00 PM",
    thursday: "9:00 AM - 6:00 PM",
    friday: "9:00 AM - 6:00 PM",
    saturday: "9:00 AM - 6:00 PM",
    sunday: "10:00 AM - 4:00 PM",
  },
  socialMedia: {
    facebook: "https://www.facebook.com/MorleyMotorCompany",
    twitter: "",
    instagram: "https://www.instagram.com/mmcmotors1",
    tiktok: "https://www.tiktok.com/@mmcmotors1",
  },
};

// Keyed by `id` — upserted so existing docs are updated and new ones inserted.
const OVERVIEWS = [
  {
    id: "tints",
    title: "Window Tints & Car Wrapping",
    subtitle: "Privacy, UV protection, style & full colour change",
    priceRange: "£200 – £800",
    duration: "2-4 hours",
    features: [
      "Premium Film Quality",
      "UV Ray Protection",
      "Heat Reduction",
      "Full & Partial Car Wraps",
      "Privacy Enhancement",
      "Lifetime Warranty",
    ],
  },
  {
    id: "repairs",
    title: "Vehicle Repairs & Diagnostics",
    subtitle: "Expert service for all makes & models",
    priceRange: "Quote on Request",
    duration: "1-5 days",
    features: [
      "Engine Diagnostics",
      "Brake System Repair",
      "Transmission Service",
      "Electrical Systems",
      "Preventive Maintenance",
    ],
  },
  {
    id: "modifications",
    title: "Vehicle Modifications",
    subtitle: "Performance, styling & bespoke upgrades",
    priceRange: "Quote on Request",
    duration: "Varies",
    features: [
      "Performance & Remapping",
      "Suspension & Handling",
      "Alloy Wheels & Tyres",
      "Exhaust Systems",
      "Styling & Body Kits",
    ],
  },
  {
    id: "tyres",
    title: "Brand New Tyres Supplied & Fitted",
    subtitle: "Quality tyres for every budget",
    priceRange: "From £45",
    duration: "30-60 mins",
    features: [
      "All Major Brands & Budgets",
      "Supplied & Fitted On Site",
      "Wheel Balancing",
      "Puncture Repairs",
      "TPMS Reset",
    ],
  },
];

async function migrate() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // The app reads from db("MMC") (src/lib/models/index.ts). Pin it so the
    // migration writes where the app reads. (Mirrors migrate-business-info.ts.)
    const db = client.db("MMC");

    // ── Core business info ──────────────────────────────────────
    const coreResult = await db.collection("businessInfo").updateOne(
      {},
      { $set: { ...CORE, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(
      coreResult.upsertedCount > 0
        ? "✅ Inserted businessInfo (core) with flyer details"
        : coreResult.modifiedCount > 0
          ? "✅ Updated businessInfo (core) with flyer details"
          : "ℹ️  businessInfo (core) already up to date"
    );

    // ── Service overviews (upsert by id) ────────────────────────
    const overviews = db.collection("serviceOverviews");
    for (const ov of OVERVIEWS) {
      const { id, ...fields } = ov;
      const r = await overviews.updateOne(
        { id },
        { $set: { id, ...fields } },
        { upsert: true }
      );
      console.log(
        r.upsertedCount > 0
          ? `  ➕ added service overview "${id}"`
          : r.modifiedCount > 0
            ? `  ✏️  updated service overview "${id}"`
            : `  ✓ service overview "${id}" already up to date`
      );
    }
    console.log("✅ Service overviews synced");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("✅ Disconnected from MongoDB");
  }
}

migrate();
