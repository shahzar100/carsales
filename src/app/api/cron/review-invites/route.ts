/**
 * CRON: SEND REVIEW INVITE EMAILS
 *
 * Vercel Cron Job that runs daily at 10:00 AM UTC.
 * Finds bookings completed ≥ 24 hours ago that haven't
 * yet received a review-invite email, sends the email,
 * and marks them as sent.
 *
 * Secured via the CRON_SECRET env var — Vercel automatically
 * sends this in the `Authorization` header for cron invocations.
 *
 * At-most-once semantics (CODEBASE_ISSUES C1):
 *   We claim each row by atomically setting `reviewInviteSentAt` BEFORE
 *   sending the email. If the send throws, we roll back the claim with
 *   `$unset` so the next run retries it. Without this, send-then-mark
 *   ordering re-sends on every transient failure, and customers get
 *   duplicate review requests.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Collection, Document } from "mongodb";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import { sendReviewInviteEmail } from "@/lib/utils/reviewInvite";
import { logError, logEvent } from "@/lib/utils/observability";

// ── How long after completion to wait before sending (ms) ────
const DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Max emails per invocation (safety limit) ─────────────────
const BATCH_LIMIT = 50;

// Allow up to 60s for processing a batch of emails
export const maxDuration = 60;

type BookingType = "service" | "viewing";

/**
 * Atomically claim a single booking and send its review-invite email.
 * Returns the outcome so the caller can tally counts. Never throws.
 */
async function claimAndSend(
  collection: Collection<Document>,
  booking: Document,
  bookingType: BookingType
): Promise<"sent" | "claimed-by-other" | "failed"> {
  // Claim: only update if `reviewInviteSentAt` still doesn't exist. If a
  // concurrent invocation already claimed it, our updateOne returns 0 and
  // we move on without sending.
  const claim = await collection.updateOne(
    { _id: booking._id, reviewInviteSentAt: { $exists: false } },
    { $set: { reviewInviteSentAt: new Date() } }
  );
  if (claim.modifiedCount !== 1) return "claimed-by-other";

  try {
    await sendReviewInviteEmail(
      booking as unknown as Record<string, unknown>,
      bookingType
    );
    return "sent";
  } catch (err) {
    // Roll back the claim so the next run picks it up.
    try {
      await collection.updateOne(
        { _id: booking._id },
        { $unset: { reviewInviteSentAt: "" } }
      );
    } catch (rollbackErr) {
      // If the rollback itself fails, log and accept that this row will
      // be permanently skipped — that's still better than re-sending.
      logError(rollbackErr, {
        route: "cron review-invites",
        action: "claim_rollback_failed",
        bookingReference: booking.bookingReference,
        bookingType,
      });
    }
    logError(err, {
      route: "cron review-invites",
      action: "send_failed",
      bookingReference: booking.bookingReference, // not PII; OK to log
      bookingType,
    });
    return "failed";
  }
}

export async function GET(request: NextRequest) {
  // ── Auth: verify Vercel cron secret ────────────────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET must be set in any environment that exposes this route to
  // the network. Previously, missing CRON_SECRET in non-production left
  // the route open. (CODEBASE_ISSUES C15.) Allow opt-out only in tests.
  if (!cronSecret && process.env.NODE_ENV !== "test") {
    logError(new Error("CRON_SECRET is not set"), {
      route: "cron review-invites",
    });
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - DELAY_MS);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // ── Service bookings ───────────────────────────────────
    const serviceCollection = await getServiceAppointmentsCollection();

    const pendingServiceReviews = await serviceCollection
      .find({
        status: "completed",
        completedAt: { $lte: cutoff },
        reviewInviteSentAt: { $exists: false },
      })
      .limit(BATCH_LIMIT)
      .toArray();

    for (const booking of pendingServiceReviews) {
      const result = await claimAndSend(
        serviceCollection as unknown as Collection<Document>,
        booking,
        "service"
      );
      if (result === "sent") sent++;
      else if (result === "claimed-by-other") skipped++;
      else failed++;
    }

    // ── Viewing bookings ───────────────────────────────────
    const viewingCollection = await getCarViewingBookingsCollection();

    const pendingViewingReviews = await viewingCollection
      .find({
        status: "completed",
        completedAt: { $lte: cutoff },
        reviewInviteSentAt: { $exists: false },
      })
      .limit(BATCH_LIMIT)
      .toArray();

    for (const booking of pendingViewingReviews) {
      const result = await claimAndSend(
        viewingCollection as unknown as Collection<Document>,
        booking,
        "viewing"
      );
      if (result === "sent") sent++;
      else if (result === "claimed-by-other") skipped++;
      else failed++;
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        sent,
        failed,
        skipped,
        serviceChecked: pendingServiceReviews.length,
        viewingChecked: pendingViewingReviews.length,
      },
    };

    // Log only counts and references — never customer name/email.
    // (CODEBASE_ISSUES F3.)
    logEvent("cron.review_invites.completed", summary.results);
    return NextResponse.json(summary);
  } catch (error) {
    logError(error, { route: "cron review-invites", action: "fatal" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
