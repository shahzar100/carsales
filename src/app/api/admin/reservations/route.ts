import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  getReservationsCollection,
  serializeDocument,
} from "@/lib/models";
import { getSession, isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";
import type { Reservation } from "@/lib/interfaces";

const writeLimiter = createRateLimiter("admin-reservations-write", {
  maxRequests: 60,
  windowMs: 60 * 1000,
});

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "expired"] as const;

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(VALID_STATUSES),
  // Optional notes/reason carried through to audit metadata.
  reason: z.string().max(500).optional(),
});

/**
 * Day 10 / Fix 10.3 — admin Reservations API.
 *
 * GET returns a paginated, status-filterable list. PATCH transitions a
 * reservation's status (most commonly pending → confirmed when the
 * customer pays the deposit in person, or pending → cancelled).
 *
 * Reservations are created customer-side via
 * /api/bookings/reservation. This route never creates a row — admin
 * only moves them through the lifecycle.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) return unauthorized();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
      200
    );

    const filter: Record<string, unknown> = {};
    if (statusParam && VALID_STATUSES.includes(statusParam as never)) {
      filter.status = statusParam;
    }

    const collection = await getReservationsCollection();
    const [rows, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reservations: rows.map((r) => serializeDocument(r) as Reservation),
      },
      pagination: { page, limit, total },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/reservations" });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) return unauthorized();

    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await writeLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request body");
    }
    const { id, status, reason } = parsed.data;

    if (!ObjectId.isValid(id)) return badRequest("Invalid reservation id");

    const collection = await getReservationsCollection();
    const now = new Date();
    const updates: Record<string, unknown> = { status, updatedAt: now };
    if (status === "confirmed") updates.confirmedAt = now;
    if (status === "cancelled") {
      updates.cancelledAt = now;
      if (reason) updates.cancellationReason = reason;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) return notFound("Reservation not found");

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: `reservation.${status}`,
      targetType: "reservation",
      targetId: id,
      metadata: reason ? { reason } : undefined,
    });

    return NextResponse.json({
      success: true,
      data: { reservation: serializeDocument(result) as Reservation },
    });
  } catch (error) {
    logError(error, { route: "PATCH /api/admin/reservations" });
    return serverError();
  }
}
