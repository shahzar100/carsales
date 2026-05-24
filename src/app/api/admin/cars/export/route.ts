import { NextResponse } from "next/server";

import { getCarsCollection } from "@/lib/models";
import {
  hasMinimumRole,
  isAuthenticated,
} from "@/lib/utils/auth";
import { logError } from "@/lib/utils/observability";
import { serverError, unauthorized, forbidden } from "@/lib/utils/apiResponse";

/**
 * GET /api/admin/cars/export
 *
 * Streams every car listing as an RFC-4180 CSV. Manager+ only; mirrors
 * the auth pattern used by /api/admin/bookings.
 */

const COLUMNS = [
  "id",
  "year",
  "make",
  "model",
  "price",
  "mileage",
  "fuel",
  "transmission",
  "doors",
  "colour",
  "status",
  "featured",
  "createdAt",
  "updatedAt",
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const raw = String(value).replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${raw}"`;
}

function toIso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}

function idAsString(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  // ObjectId has toHexString(); fall back to String() for anything else.
  if (
    typeof value === "object" &&
    value !== null &&
    "toHexString" in value &&
    typeof (value as { toHexString: () => string }).toHexString === "function"
  ) {
    return (value as { toHexString: () => string }).toHexString();
  }
  return String(value);
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) return unauthorized();
    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const carsCol = await getCarsCollection();
    const docs = await carsCol.find({}).sort({ createdAt: -1 }).toArray();

    const rows: string[] = [COLUMNS.map(csvCell).join(",")];

    for (const c of docs) {
      rows.push(
        [
          idAsString(c._id),
          c.year,
          c.make,
          c.model,
          c.price,
          c.mileage,
          c.fuel,
          c.transmission,
          c.doors,
          c.colour,
          c.status,
          // Excel renders "TRUE"/"FALSE" cleaner than "true"/"false" — use
          // the lowercase form for consistency with JSON conventions; the
          // operator can :=UPPER() in their sheet if they care.
          c.featured ? "true" : "false",
          toIso(c.createdAt),
          toIso(c.updatedAt),
        ]
          .map(csvCell)
          .join(",")
      );
    }

    const csv = rows.join("\r\n") + "\r\n";
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cars-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/cars/export" });
    return serverError();
  }
}
