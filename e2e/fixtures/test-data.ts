/**
 * Static payloads for E2E tests. Kept here so tests stay focused on flow,
 * not data construction.
 *
 * Email addresses use `+e2e-{suite}` so they're easy to filter out of
 * production data if a test ever runs against the wrong DB by accident.
 */

export const testCar = {
  make: "Tesla",
  model: "Model 3 (E2E)",
  year: 2023,
  price: 35000,
  mileage: 12000,
  condition: "used" as const,
  status: "available" as const,
  description: "Seeded by E2E test suite. Safe to delete.",
  bodyStyle: "saloon" as const,
  fuelType: "electric" as const,
  transmission: "automatic" as const,
  colour: "white",
  featured: false,
  imageUrl: "/tesla.webp",
};

export const testCarPart = {
  name: "Brake Pad Set (E2E)",
  brand: "Brembo",
  category: "Brakes",
  price: 89.99,
  condition: "New" as const,
  compatibility: "BMW 3 Series",
  description: "Seeded by E2E test suite. Safe to delete.",
  inStock: true,
};

export const customer = {
  name: "E2E Test Customer",
  email: "e2e-customer+booking@example.com",
  phone: "07700900123",
};

export const futureBookingDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
})();

export const futureBookingTime = "10:00";

/**
 * Default admin credentials. The CI workflow injects deterministic values
 * via env; locally the user's `.env.local` controls them.
 *
 * Falls back to obviously-fake defaults so a misconfigured local run fails
 * loudly rather than silently authenticating against a real account.
 */
export const adminCredentials = {
  username: process.env.E2E_ADMIN_USERNAME || "admin",
  password: process.env.E2E_ADMIN_PASSWORD || "ci-e2e-admin-password",
};
