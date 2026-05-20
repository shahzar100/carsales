import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import { ok, badRequest, serverError } from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";

/**
 * Public car lookup by id — `GET /api/cars?ids=<id>,<id>,…`
 *
 * Backs the customer "Saved cars" page and the account "Saved" tab: the
 * saved-car ids live in the browser (SavedCarsContext) and this endpoint
 * returns the full car records for them.
 *
 * Only `status: "available"` cars are returned, so a car that has since
 * sold simply drops off the saved list. Public + read-only — the whole
 * fleet is already browsable — and the id list is de-duplicated and
 * capped so the `$in` query stays bounded.
 *
 * Response: `{ success: true, data: { cars: CarInterface[] } }`.
 */

// Saved lists are capped at 50 in SavedCarsContext; allow some headroom.
const MAX_IDS = 100;

export async function GET(request: NextRequest) {
  try {
    const idsParam = new URL(request.url).searchParams.get("ids");
    if (!idsParam) {
      return badRequest("An `ids` query parameter is required");
    }

    // Parse, trim, de-duplicate, keep only well-formed ObjectIds, cap.
    const objectIds = [...new Set(idsParam.split(","))]
      .map((s) => s.trim())
      .filter((s) => ObjectId.isValid(s))
      .slice(0, MAX_IDS)
      .map((s) => new ObjectId(s));

    if (objectIds.length === 0) {
      return ok({ cars: [] });
    }

    const carsCollection = await getCarsCollection();
    const cars = await carsCollection
      .find({ _id: { $in: objectIds } as never, status: "available" })
      .toArray();

    return ok({ cars: cars.map((car) => serializeDocument(car)) });
  } catch (error) {
    logError(error, { route: "GET /api/cars" });
    return serverError();
  }
}
