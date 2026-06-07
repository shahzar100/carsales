/**
 * Direct DB helpers for the operational suite. Connects to the launcher's
 * mongod (MONGODB_URI). Guards against ever pointing at a non-local host.
 */
import { MongoClient, type Db } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI ?? "";
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)/.test(uri)) {
  throw new Error(
    `[operational] MONGODB_URI is not local (${uri}). Run via e2e/operational/run.mjs.`
  );
}

let client: MongoClient | null = null;
export async function db(): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db("MMC");
}
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}

export async function seedAdmin(
  username: string,
  password: string,
  role: "admin" | "manager" | "staff"
): Promise<void> {
  const d = await db();
  await d.collection("adminUsers").updateOne(
    { username },
    {
      $set: {
        username,
        email: `${username}@example.com`,
        passwordHash: await bcrypt.hash(password, 12),
        role,
        totpEnabled: false,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

export async function seedCustomer(email: string, password: string): Promise<void> {
  const d = await db();
  await d.collection("users").updateOne(
    { email },
    {
      $set: {
        email,
        name: "Op Customer",
        password: await bcrypt.hash(password, 12),
        emailVerified: new Date(),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

export async function seedCar(): Promise<string> {
  const d = await db();
  const r = await d.collection("cars").insertOne({
    make: "Audi",
    model: "A4 (OP)",
    year: 2023,
    price: 35000,
    mileage: 12000,
    fuel: "Petrol",
    transmission: "Automatic",
    doors: 4,
    colour: "black",
    image: "/tesla.webp",
    images: ["/tesla.webp"],
    description: "Operational seed.",
    status: "available",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return r.insertedId.toString();
}

/**
 * Seed a viewing booking with explicit status/timing so the cron query can be
 * exercised precisely. `hoursSinceCompleted` controls eligibility (cron sends
 * for completed >= 24h ago that haven't been invited yet).
 */
export async function seedCompletedViewing(opts: {
  email: string;
  status?: "completed" | "pending";
  hoursSinceCompleted?: number;
  alreadyInvited?: boolean;
}): Promise<string> {
  const d = await db();
  const ref = `OP-${Math.abs(Date.now() % 1_000_000)}-${Math.floor(performance.now())}`;
  const doc: Record<string, unknown> = {
    bookingReference: ref,
    carId: "op-car",
    carDetails: { make: "Audi", model: "A4 (OP)", year: 2023, price: 35000, image: "" },
    customerInfo: { name: "Op Customer", email: opts.email, phone: "07700900123" },
    appointmentDate: "2025-01-01",
    appointmentTime: "10:00",
    status: opts.status ?? "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  if ((opts.status ?? "completed") === "completed") {
    const hrs = opts.hoursSinceCompleted ?? 25;
    doc.completedAt = new Date(Date.now() - hrs * 60 * 60 * 1000);
  }
  if (opts.alreadyInvited) doc.reviewInviteSentAt = new Date();
  await d.collection("carViewingBookings").insertOne(doc);
  return ref;
}
