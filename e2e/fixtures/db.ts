/**
 * Direct DB helpers for E2E tests.
 *
 * The booking flow doesn't have a public "create car" endpoint (admin-only,
 * and the multi-step CarForm is an admin UI), so for tests that need a car
 * to view, we seed via the same MongoDB driver the app uses.
 *
 * The DB is whatever `MONGODB_URI` points at — in CI that's the mongo:7
 * service container on 27017, locally it's the user's dev DB. We pin the
 * database to "MMC" because that's what `src/lib/models/index.ts` reads
 * from (CODEBASE_ISSUES C2).
 */
import { MongoClient, ObjectId, type Db } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "MONGODB_URI must be set for E2E tests. Check .env.local or the CI env block."
  );
}

let client: MongoClient | null = null;

async function getDb(): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri!);
    await client.connect();
  }
  // Pin to MMC so the fixtures write where the app reads.
  return client.db("MMC");
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}

/**
 * Seed an admin user so login-based E2E specs can authenticate.
 * (CODEBASE_ISSUES A3 / J1.)
 *
 * Idempotent — `upsert: true` on `username`. Uses bcrypt cost 12 to match
 * the runtime `hashPassword` (src/lib/utils/auth.ts).
 */
export async function seedAdminUser(opts: {
  username: string;
  password: string;
  email?: string;
  role?: "admin" | "manager" | "staff";
}): Promise<void> {
  const db = await getDb();
  const passwordHash = await bcrypt.hash(opts.password, 12);
  await db.collection("adminUsers").updateOne(
    { username: opts.username },
    {
      $set: {
        username: opts.username,
        email: opts.email ?? `${opts.username}@e2e.example.com`,
        passwordHash,
        role: opts.role ?? "admin",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

/**
 * Seed a car. Returns the inserted _id as a string so it can be used in
 * URLs (`/BrowseFleet/{id}`). Field names mirror `CarInterface`
 * (`fuel`, `transmission`, `image`/`images`) — earlier versions of this
 * fixture used `fuelType`/`bodyStyle`/`imageUrl` which don't exist in the
 * runtime schema and would have caused detail-page renders to fail.
 */
export async function seedCar(
  partial: Record<string, unknown> = {}
): Promise<string> {
  const db = await getDb();
  const doc = {
    make: "Tesla",
    model: "Model 3 (E2E)",
    year: 2023,
    price: 35000,
    mileage: 12000,
    fuel: "Electric",
    transmission: "Automatic",
    doors: 4,
    colour: "white",
    image: "/tesla.webp",
    images: ["/tesla.webp"],
    description: "Seeded by E2E test suite. Safe to delete.",
    status: "available",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
  const result = await db.collection("cars").insertOne(doc);
  return result.insertedId.toString();
}

export async function seedCarPart(
  partial: Record<string, unknown> = {}
): Promise<string> {
  const db = await getDb();
  const doc = {
    name: "Brake Pad Set (E2E)",
    brand: "Brembo",
    category: "Brakes",
    price: 89.99,
    condition: "New",
    compatibility: "BMW 3 Series",
    description: "Seeded by E2E test suite. Safe to delete.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
  // Collection name must match `src/lib/models/index.ts` — `carParts`,
  // camelCase. (CODEBASE_ISSUES J1.)
  const result = await db.collection("carParts").insertOne(doc);
  return result.insertedId.toString();
}

/**
 * Insert a viewing booking directly so the lookup test has something to find.
 * The reference is generated to match the live API's BK-XXXXXX shape.
 *
 * Collection and shape match what `/api/bookings/lookup` reads:
 *   collection: `carViewingBookings`
 *   `customerInfo: { email, name, phone }` (nested, not flat)
 *   `appointmentDate` / `appointmentTime` (not `date` / `time`)
 * Earlier versions of this fixture wrote to `bookings` with flat fields
 * which made the lookup spec impossible to pass. (CODEBASE_ISSUES J1.)
 */
export async function seedViewingBooking(opts: {
  carId: string;
  email: string;
  reference?: string;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
}): Promise<string> {
  const db = await getDb();
  const reference =
    opts.reference ||
    `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  await db.collection("carViewingBookings").insertOne({
    bookingReference: reference,
    carId: opts.carId,
    carDetails: {
      make: "Tesla",
      model: "Model 3 (E2E)",
      year: 2023,
      price: 35000,
      image: "/tesla.webp",
    },
    customerInfo: {
      name: "E2E Lookup Customer",
      email: opts.email,
      phone: "07700900123",
    },
    appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    appointmentTime: "10:00",
    status: opts.status || "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return reference;
}

/**
 * Wipe E2E-seeded rows. Filters on the `(E2E)` marker in `model`/`name`
 * and the `e2e-` prefix in `customerInfo.email` so we never touch real data.
 *
 * Note: cleanup uses `$regex` against test-only data we control. The
 * production-route warnings about `$regex` on user input don't apply here —
 * the patterns are literals defined in test code.
 */
export async function cleanupE2EData(): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.collection("cars").deleteMany({ model: { $regex: /\(E2E\)/ } }),
    db.collection("carParts").deleteMany({ name: { $regex: /\(E2E\)/ } }),
    db.collection("carViewingBookings").deleteMany({
      $or: [
        { "customerInfo.email": { $regex: /^e2e-/ } },
        { "customerInfo.email": { $regex: /e2e-customer/ } },
        { "customerInfo.email": { $regex: /^e2e-lookup/ } },
      ],
    }),
    db.collection("serviceAppointments").deleteMany({
      "customerInfo.email": { $regex: /^e2e-/ },
    }),
    db.collection("quotes").deleteMany({
      "customerInfo.email": { $regex: /^e2e-/ },
    }),
  ]);
}
