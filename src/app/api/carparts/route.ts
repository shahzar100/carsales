import { NextRequest } from "next/server";
import { getCarPartsCollection, serializeDocument } from "@/lib/models";
import { ok, serverError } from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";

/**
 * GET /api/carparts — public car-parts listing.
 *
 * Read-only. This route previously auto-seeded the collection with mock
 * data whenever it was empty, which meant an unauthenticated GET could
 * trigger a database write (and quietly resurrect mock inventory in
 * production). Seeding has been removed — an empty collection now simply
 * returns `[]`. Real inventory is created through the admin API
 * (`POST /api/admin/carparts`).
 */
export async function GET(request: NextRequest) {
  try {
    const carPartsCollection = await getCarPartsCollection();

    // Build filter from optional query params
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand");
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");

    const filter: Record<string, string> = {};
    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (condition) filter.condition = condition;

    const parts = await carPartsCollection.find(filter).toArray();

    return ok(parts.map((part) => serializeDocument(part)));
  } catch (error) {
    logError(error, { route: "GET /api/carparts" });
    return serverError();
  }
}
