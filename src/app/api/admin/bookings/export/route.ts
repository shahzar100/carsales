import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";

import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import {
  hasMinimumRole,
  isAuthenticated,
} from "@/lib/utils/auth";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import {
  serverError,
  unauthorized,
  forbidden,
  tooManyRequests,
} from "@/lib/utils/apiResponse";

// Full-collection scans are expensive — cap to 10/min/IP so a stuck
// admin tab (or a compromised session) can't repeatedly pull the entire
// bookings + viewings dataset and saturate Atlas IOPS.
const exportLimiter = createRateLimiter("admin-bookings-export", {
  maxRequests: 10,
  windowMs: 60 * 1000,
});

/**
 * GET /api/admin/bookings/export
 *
 * Streams every booking — both service appointments and car viewings —
 * as a single RFC-4180 CSV. Manager+ only; mirrors the auth pattern in
 * /api/admin/bookings.
 *
 * The export merges the two collections into a uniform row shape so
 * the operator gets one spreadsheet, not two. Service-only fields
 * (vehicleMake/Model) are blank for service rows; viewing-only fields
 * (notes) are blank for viewing rows.
 */

const COLUMNS = [
  "ref",
  "customerName",
  "customerEmail",
  "customerPhone",
  "serviceType",
  "status",
  "scheduledDate",
  "scheduledTime",
  "vehicleMake",
  "vehicleModel",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

/**
 * RFC-4180 cell encoding: wrap in `"`, escape internal `"` as `""`,
 * and strip embedded newlines (operators paste these straight into
 * spreadsheets — a stray newline shifts every following cell).
 */
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

export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) return unauthorized();
    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await exportLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many export requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const [serviceCol, viewingCol] = await Promise.all([
      getServiceAppointmentsCollection(),
      getCarViewingBookingsCollection(),
    ]);

    const [serviceDocs, viewingDocs] = await Promise.all([
      serviceCol.find({}).sort({ createdAt: -1 }).toArray(),
      viewingCol.find({}).sort({ createdAt: -1 }).toArray(),
    ]);

    const rows: string[] = [COLUMNS.map(csvCell).join(",")];

    for (const b of serviceDocs) {
      rows.push(
        [
          b.bookingReference,
          b.customerInfo?.name,
          b.customerInfo?.email,
          b.customerInfo?.phone,
          b.serviceType,
          b.status,
          b.appointmentDate,
          b.appointmentTime,
          "", // vehicleMake — service bookings don't carry car details
          "", // vehicleModel
          b.serviceDetails ?? "",
          toIso(b.createdAt),
          toIso(b.updatedAt),
        ]
          .map(csvCell)
          .join(",")
      );
    }

    for (const b of viewingDocs) {
      rows.push(
        [
          b.bookingReference,
          b.customerInfo?.name,
          b.customerInfo?.email,
          b.customerInfo?.phone,
          "viewing", // serviceType — fixed label for viewings
          b.status,
          b.appointmentDate,
          b.appointmentTime,
          b.carDetails?.make ?? "",
          b.carDetails?.model ?? "",
          "", // notes — viewing schema has no free-text notes today
          toIso(b.createdAt),
          toIso(b.updatedAt),
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
        "Content-Disposition": `attachment; filename="bookings-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/bookings/export" });
    return serverError();
  }
}
