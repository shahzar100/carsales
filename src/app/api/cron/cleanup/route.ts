/**
 * CRON: CLEANUP STALE RESERVATIONS + BOOKINGS
 *
 * Vercel Cron Job that runs daily at 03:00 UTC. Two independent
 * sweeps run in series, each wrapped in its own try/catch so a
 * Mongo blip on one collection doesn't bail the whole cron:
 *
 *   1. `reservations` with `status === "pending"` and
 *      `createdAt < now - 48h` → flip to `expired` and stamp
 *      `expiredAt`. Customer never showed up to pay the deposit.
 *      The held car is also flipped back to `available` (only when it's
 *      still `reserved`) so it returns to the storefront — without this
 *      an expired reservation silently strands the car forever.
 *
 *   2. `serviceAppointments` and `carViewingBookings` with
 *      `status === "pending"` and `appointmentDate < today - 24h`
 *      → flip to `no_show`. The appointment time has come and gone
 *      without staff transitioning it to `confirmed`/`completed`.
 *
 * `appointmentDate` is stored as a `YYYY-MM-DD` string (see
 * `src/lib/interfaces.ts`), so it can be compared lexicographically
 * against another ISO-8601 date string — cheaper than parsing every
 * row server-side.
 *
 * Idempotent by construction: both updates select on the source
 * `status` ("pending") and set the target status; a second run
 * matches zero documents.
 *
 * Secured via the CRON_SECRET env var — Vercel automatically sends
 * this in the `Authorization` header for cron invocations. Same
 * constant-time-compare pattern as `review-invites`.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import {
  getReservationsCollection,
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  getCarsCollection,
} from "@/lib/models";
import { recordAudit } from "@/lib/utils/audit";
import { logError, logEvent } from "@/lib/utils/observability";

const RESERVATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const BOOKING_GRACE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Allow up to 60s; updateMany batches across the whole table.
export const maxDuration = 60;

/**
 * Constant-time compare of the incoming `Authorization` header against
 * `Bearer <CRON_SECRET>`. Both sides are SHA-256 hashed so that
 * `timingSafeEqual` always receives equal-length buffers — see the
 * matching helper in `cron/review-invites/route.ts` for the why.
 */
function timingSafeMatch(received: string | null, expected: string): boolean {
  const a = crypto.createHash("sha256").update(received ?? "").digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Format a Date as `YYYY-MM-DD` (UTC). */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  // ── Auth: verify Vercel cron secret ────────────────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET must be set in any environment that exposes this route to
  // the network. Allow opt-out only in tests so the in-memory Mongo suite
  // doesn't need to thread the secret through every assertion.
  if (!cronSecret && process.env.NODE_ENV !== "test") {
    logError(new Error("CRON_SECRET is not set"), { route: "cron cleanup" });
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (cronSecret && !timingSafeMatch(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const reservationCutoff = new Date(now.getTime() - RESERVATION_TTL_MS);
  const bookingCutoffDate = toIsoDate(
    new Date(now.getTime() - BOOKING_GRACE_MS)
  );

  let expiredReservations = 0;
  let carsReleased = 0;
  let expiredBookings = 0;

  // ── 1. Reservations: stale `pending` → `expired` ───────────
  try {
    const collection = await getReservationsCollection();

    // Snapshot the matching docs *before* the bulk update so we can write
    // one audit row per reservation. Acceptable for batch cron volume.
    const stale = await collection
      .find({
        status: "pending",
        createdAt: { $lt: reservationCutoff },
      })
      .project({ _id: 1, reservationReference: 1, carId: 1 })
      .toArray();

    if (stale.length > 0) {
      const ids = stale.map((d) => d._id);
      const result = await collection.updateMany(
        { _id: { $in: ids }, status: "pending" },
        {
          $set: {
            status: "expired",
            expiredAt: now,
            updatedAt: now,
          },
        }
      );
      expiredReservations = result.modifiedCount;

      // Release each held car back to `available` — but only if it's
      // still `reserved` (a confirmed sale or another reservation may have
      // moved it on; don't resurrect a sold car). Without this the car
      // stays `reserved` forever and vanishes from the storefront.
      const carsColl = await getCarsCollection();
      for (const doc of stale) {
        if (doc.carId && ObjectId.isValid(doc.carId)) {
          const carResult = await carsColl.updateOne(
            { _id: new ObjectId(doc.carId), status: "reserved" },
            { $set: { status: "available", updatedAt: now } }
          );
          if (carResult.modifiedCount === 1) carsReleased++;
        }
      }

      // Audit each transition — never blocks the cron on failure
      // (recordAudit swallows + reports errors internally).
      for (const doc of stale) {
        await recordAudit({
          actor: "system:cron-cleanup",
          action: "reservation.expired",
          targetType: "reservation",
          targetId: String(doc._id),
          metadata: { reservationReference: doc.reservationReference },
        });
      }
    }
  } catch (error) {
    logError(error, { route: "cron cleanup", action: "reservations" });
  }

  // ── 2. Bookings (service + viewing): past `pending` → `no_show` ──
  try {
    const [serviceCollection, viewingCollection] = await Promise.all([
      getServiceAppointmentsCollection(),
      getCarViewingBookingsCollection(),
    ]);

    // `no_show` is not in the interface's status union (which limits
    // values to pending/confirmed/completed/cancelled), but the cron
    // is explicitly the seam that introduces this terminal state. Cast
    // narrowly here so the model interface stays the source of truth
    // for normal write paths.
    const noShowUpdate = {
      $set: {
        status: "no_show" as unknown as "cancelled",
        updatedAt: now,
      },
    };
    const noShowFilter = {
      status: "pending" as const,
      appointmentDate: { $lt: bookingCutoffDate },
    };

    const [serviceRes, viewingRes] = await Promise.all([
      serviceCollection.updateMany(noShowFilter, noShowUpdate),
      viewingCollection.updateMany(noShowFilter, noShowUpdate),
    ]);
    expiredBookings = serviceRes.modifiedCount + viewingRes.modifiedCount;
  } catch (error) {
    logError(error, { route: "cron cleanup", action: "bookings" });
  }

  const summary = { expiredReservations, carsReleased, expiredBookings };
  logEvent("cron.cleanup.completed", summary);
  return NextResponse.json(summary);
}
