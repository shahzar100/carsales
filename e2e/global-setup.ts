/**
 * Playwright globalSetup. Runs once before any spec.
 *
 * Seeds an admin user so admin-flow specs can authenticate. Without this,
 * every admin spec would hit "Invalid credentials" against the empty
 * mongo:7 service container that CI brings up. (CODEBASE_ISSUES A3 / J1.)
 *
 * Idempotent — re-running on a populated DB is a no-op-ish update.
 */
import { seedAdminUser, closeDb } from "./fixtures/db";
import { adminCredentials } from "./fixtures/test-data";

export default async function globalSetup() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI must be set for E2E globalSetup. Check the CI env block or .env.local."
    );
  }
  await seedAdminUser({
    username: adminCredentials.username,
    password: adminCredentials.password,
    email: "admin@e2e.example.com",
    role: "admin",
  });
  await closeDb();
}
