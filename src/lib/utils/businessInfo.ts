import type {
  ShopInfo,
  DetailingPackage,
  TintOption,
  ServiceOverview,
  RecoveryInfo,
} from "@/lib/interfaces";
import {
  getBusinessInfoCollection,
  getDetailingPackagesCollection,
  getTintOptionsCollection,
  getServiceOverviewsCollection,
  getRecoveryInfoCollection,
  serializeDocument,
} from "@/lib/models";

/**
 * Seed data split across collections.
 * Inserted into MongoDB on first read; after that, all values come from the DB.
 */

// ── Core business info ───────────────────────────────────────
const CORE_SEED: Omit<
  ShopInfo,
  "_id" | "detailingPackages" | "tintOptions" | "serviceOverviews" | "recovery"
> = {
  businessName: "Car Sales & Viewing",
  address: "123 Auto Street",
  city: "City",
  state: "",
  zipCode: "",
  phone: "(555) 123-4567",
  email: "info@carsales.com",
  bookingsEmail: "bookings@carsales.com",
  googleMapsUrl: "https://maps.google.com",
  hours: {
    monday: "9:00 AM - 6:00 PM",
    tuesday: "9:00 AM - 6:00 PM",
    wednesday: "9:00 AM - 6:00 PM",
    thursday: "9:00 AM - 6:00 PM",
    friday: "9:00 AM - 6:00 PM",
    saturday: "9:00 AM - 4:00 PM",
    sunday: "Closed",
  },
  description:
    "Browse our premium car collection with convenient viewing and booking services.",
  socialMedia: {
    facebook: "",
    twitter: "",
    instagram: "",
  },
  heroStats: {
    vehicles: { value: "500+", label: "Quality Vehicles" },
    booking: { value: "24/7", label: "Online Booking" },
    rating: { value: "4.9", label: "Customer Rating" },
  },
  updatedAt: new Date(),
};

// ── Detailing packages (one doc each) ────────────────────────
const DETAILING_SEED: DetailingPackage[] = [
  {
    id: "bronze",
    name: "Detailing Bronze",
    subtitle: "Mini Valet",
    price: "£150",
    priceInPence: 15000,
    duration: "2-3 hours",
    description: "Essential cleaning for your vehicle inside and out",
    exteriorFeatures: [
      "Citrus pre wash treatment",
      "Snow foam",
      "Contact wash",
      "Towel and blow dry",
      "Alloy wheels, tyres and arches deep cleaned",
      "Tyre dressing",
    ],
    interiorFeatures: [
      "Seats, mats and carpets vacuumed",
      "High pressure blowout",
      "All interior plastics and surfaces hot wiped",
      "Steering wheel clean program",
      "Windows cleaned inside and out",
    ],
    popular: false,
    includesPrevious: null,
  },
  {
    id: "silver",
    name: "Detailing Silver",
    subtitle: "Mini Outside, Full Inside",
    price: "£280",
    priceInPence: 28000,
    duration: "4-5 hours",
    description:
      "Enhanced exterior protection with comprehensive interior deep clean",
    exteriorFeatures: [
      "All services from Bronze",
      "3 month high gloss ceramic protection",
    ],
    interiorFeatures: [
      "All services from Bronze",
      "All interior plastics and surfaces deep cleaned",
      "Leather conditioner / fabric shampoo",
      "All surfaces, plastics steam cleaned",
    ],
    popular: true,
    includesPrevious: "Bronze",
  },
  {
    id: "gold",
    name: "Detailing Gold",
    subtitle: "Complete Premium Service",
    price: "£450",
    priceInPence: 45000,
    duration: "6-8 hours",
    description:
      "Ultimate detailing package with full paint decontamination and deep interior extraction",
    exteriorFeatures: [
      "All services from Silver",
      "Paint decontamination",
      "Iron contaminant removal",
      "Tar and glue contaminant removal",
      "Clay bar treatment",
    ],
    interiorFeatures: [
      "All services from Silver",
      "Full extraction clean of seats, mats and carpets",
    ],
    popular: false,
    includesPrevious: "Silver",
  },
];

// ── Tint options (one doc each) ──────────────────────────────
const TINT_SEED: TintOption[] = [
  {
    name: "Ceramic Premium",
    type: "Ceramic",
    price: "£400-£800",
    priceMinInPence: 40000,
    priceMaxInPence: 80000,
    vlt: "5%, 20%, 35%, 50%",
    warranty: "Lifetime",
    description:
      "Top-tier ceramic film with superior heat rejection and clarity",
    features: [
      "99% UV protection",
      "Superior heat rejection (up to 80%)",
      "No signal interference",
      "Fade resistant",
      "Scratch resistant",
      "Lifetime warranty",
    ],
    popular: true,
  },
  {
    name: "Carbon Series",
    type: "Carbon",
    price: "£300-£600",
    priceMinInPence: 30000,
    priceMaxInPence: 60000,
    vlt: "5%, 20%, 35%, 50%",
    warranty: "10 Years",
    description:
      "Advanced carbon technology for excellent performance and durability",
    features: [
      "99% UV protection",
      "Good heat rejection (up to 60%)",
      "Non-metallic (no interference)",
      "Matte finish appearance",
      "Color stable",
      "10-year warranty",
    ],
    popular: false,
  },
  {
    name: "Dyed Film",
    type: "Traditional",
    price: "£200-£400",
    priceMinInPence: 20000,
    priceMaxInPence: 40000,
    vlt: "5%, 20%, 35%, 50%",
    warranty: "5 Years",
    description:
      "Quality dyed film offering good privacy and basic heat rejection",
    features: [
      "95% UV protection",
      "Basic heat rejection (up to 35%)",
      "Good privacy",
      "Cost-effective",
      "Professional installation",
      "5-year warranty",
    ],
    popular: false,
  },
];

// ── Service overviews (one doc each) ─────────────────────────
const SERVICE_OVERVIEW_SEED: ServiceOverview[] = [
  {
    id: "detailing",
    title: "Car Detailing",
    subtitle: "Premium interior & exterior care",
    priceRange: "£150 – £500",
    duration: "3-6 hours",
    features: [
      "Interior & Exterior Deep Clean",
      "Paint Protection & Waxing",
      "Leather Treatment",
      "Engine Bay Cleaning",
      "Ceramic Coating Available",
    ],
  },
  {
    id: "tints",
    title: "Window Tinting",
    subtitle: "Privacy, UV protection & style",
    priceRange: "£200 – £800",
    duration: "2-4 hours",
    features: [
      "Premium Film Quality",
      "UV Ray Protection",
      "Heat Reduction",
      "Privacy Enhancement",
      "Lifetime Warranty",
    ],
  },
  {
    id: "repairs",
    title: "Auto Repairs",
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
];

// ── Recovery info (single doc) ───────────────────────────────
const RECOVERY_SEED: RecoveryInfo = {
  coverageAreas: [
    "Central London",
    "North London",
    "South London",
    "East London",
    "West London",
    "Greater London",
    "Surrey",
    "Kent",
    "Essex",
    "Hertfordshire",
    "Berkshire",
    "Buckinghamshire",
  ],
  pricingTiers: [
    {
      name: "Local Recovery",
      price: "From £60",
      distance: "Within 10 miles",
    },
    { name: "Regional Recovery", price: "From £95", distance: "10–30 miles" },
    { name: "Long Distance", price: "Call Us", distance: "30+ miles" },
  ],
  responseTime: "30-45 minutes within London",
};

// ── Helper: seed a collection if empty ───────────────────────
import type { Collection, OptionalUnlessRequiredId, Document } from "mongodb";

async function seedIfEmpty<T extends Document>(
  collection: Collection<T>,
  data: T | T[]
): Promise<void> {
  const count = await collection.countDocuments({}, { limit: 1 });
  if (count === 0) {
    if (Array.isArray(data)) {
      await collection.insertMany(data as OptionalUnlessRequiredId<T>[]);
    } else {
      await collection.insertOne(data as OptionalUnlessRequiredId<T>);
    }
  }
}

/**
 * Fetch business info from MongoDB, assembled from multiple collections.
 * On first ever read, seeds each collection with initial data.
 */
export async function getBusinessInfo(): Promise<ShopInfo> {
  // Fetch all collections in parallel
  const [coreColl, detailingColl, tintColl, overviewColl, recoveryColl] =
    await Promise.all([
      getBusinessInfoCollection(),
      getDetailingPackagesCollection(),
      getTintOptionsCollection(),
      getServiceOverviewsCollection(),
      getRecoveryInfoCollection(),
    ]);

  // Seed any empty collections
  await Promise.all([
    seedIfEmpty(coreColl, CORE_SEED as ShopInfo),
    seedIfEmpty(detailingColl, DETAILING_SEED),
    seedIfEmpty(tintColl, TINT_SEED),
    seedIfEmpty(overviewColl, SERVICE_OVERVIEW_SEED),
    seedIfEmpty(recoveryColl, RECOVERY_SEED),
  ]);

  // Read everything in parallel
  const [coreDoc, detailingDocs, tintDocs, overviewDocs, recoveryDoc] =
    await Promise.all([
      coreColl.findOne({}),
      detailingColl.find({}).toArray(),
      tintColl.find({}).toArray(),
      overviewColl.find({}).toArray(),
      recoveryColl.findOne({}),
    ]);

  // Assemble into the ShopInfo shape consumers expect
  const assembled: ShopInfo = {
    ...serializeDocument(coreDoc!),
    detailingPackages: detailingDocs.map(
      (d) => serializeDocument(d) as DetailingPackage
    ),
    tintOptions: tintDocs.map((t) => serializeDocument(t) as TintOption),
    serviceOverviews: overviewDocs.map(
      (s) => serializeDocument(s) as ServiceOverview
    ),
    recovery: recoveryDoc
      ? (serializeDocument(recoveryDoc) as RecoveryInfo)
      : undefined,
  } as ShopInfo;

  return assembled;
}

/**
 * Update business info by writing to the appropriate split collections.
 * Used by the admin PUT route.
 */
export async function updateBusinessInfo(
  data: Partial<ShopInfo>
): Promise<void> {
  const updates: Promise<unknown>[] = [];

  // Core fields
  const {
    detailingPackages,
    tintOptions,
    serviceOverviews,
    recovery,
    _id,
    ...coreFields
  } = data;

  if (Object.keys(coreFields).length > 0) {
    const coreColl = await getBusinessInfoCollection();
    updates.push(
      coreColl.updateOne(
        {},
        { $set: { ...coreFields, updatedAt: new Date() } },
        { upsert: true }
      )
    );
  }

  if (detailingPackages !== undefined) {
    const coll = await getDetailingPackagesCollection();
    updates.push(
      coll.deleteMany({}).then(() => {
        if (detailingPackages.length > 0) {
          return coll.insertMany(detailingPackages);
        }
      })
    );
  }

  if (tintOptions !== undefined) {
    const coll = await getTintOptionsCollection();
    updates.push(
      coll.deleteMany({}).then(() => {
        if (tintOptions.length > 0) {
          return coll.insertMany(tintOptions);
        }
      })
    );
  }

  if (serviceOverviews !== undefined) {
    const coll = await getServiceOverviewsCollection();
    updates.push(
      coll.deleteMany({}).then(() => {
        if (serviceOverviews.length > 0) {
          return coll.insertMany(serviceOverviews);
        }
      })
    );
  }

  if (recovery !== undefined) {
    const coll = await getRecoveryInfoCollection();
    updates.push(coll.updateOne({}, { $set: recovery }, { upsert: true }));
  }

  await Promise.all(updates);
}
