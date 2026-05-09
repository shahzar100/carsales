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
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import { sendReviewInviteEmail } from "@/lib/utils/reviewInvite";

// ── How long after completion to wait before sending (ms) ────
const DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Max emails per invocation (safety limit) ─────────────────
const BATCH_LIMIT = 50;

// Allow up to 60s for processing a batch of emails
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // ── Auth: verify Vercel cron secret ────────────────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET must be set — reject if missing
  if (!cronSecret && process.env.NODE_ENV === "production") {
    console.error("CRON_SECRET is not set in production");
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
      try {
        await sendReviewInviteEmail(
          booking as unknown as Record<string, unknown>,
          "service"
        );
        await serviceCollection.updateOne(
          { _id: booking._id },
          { $set: { reviewInviteSentAt: new Date() } }
        );
        sent++;
      } catch (err) {
        console.error(
          `❌ Review invite failed for service booking ${booking.bookingReference}:`,
          err
        );
        failed++;
      }
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
      try {
        await sendReviewInviteEmail(
          booking as unknown as Record<string, unknown>,
          "viewing"
        );
        await viewingCollection.updateOne(
          { _id: booking._id },
          { $set: { reviewInviteSentAt: new Date() } }
        );
        sent++;
      } catch (err) {
        console.error(
          `❌ Review invite failed for viewing booking ${booking.bookingReference}:`,
          err
        );
        failed++;
      }
    }

    skipped =
      pendingServiceReviews.length +
      pendingViewingReviews.length -
      sent -
      failed;

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

    console.log("📧 Review invite cron completed:", summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("❌ Review invite cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
