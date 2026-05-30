import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { waitUntil } from "@vercel/functions";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { getCustomerIdentity } from "@/lib/utils/customerAuth";
import { sendEmail } from "@/emails/send";
import { BookingCancellation } from "@/emails/BookingCancellation";
import { logError, logEvent } from "@/lib/utils/observability";
import React from "react";

// (Fix 2 / security) Tight schema replaces the original
// `const { bookingReference, type, reason } = body` destructure. Without
// this, a body of `{"bookingReference": {"$gt": ""}}` forged a Mongo
// operator filter and matched the first non-cancelled booking in the
// collection.
//
// The reference regex anchors to the BK- shape the booking generator
// produces (`src/lib/utils/booking.ts#generateBookingReference`). The
// `type` enum mirrors the canonical customer-facing booking taxonomy
// used by `src/app/api/account/bookings/route.ts` plus the two enquiry
// kinds that have their own collections. Only `service` + `viewing`
// have cancel semantics today; the other types fall through to a 400
// from the type switch below, but listing them here keeps the schema
// honest if/when those routes grow a cancel path.
const cancelSchema = z.object({
  bookingReference: z.string().regex(/^BK-[A-Z0-9]{6}$/i),
  type: z.enum(["service", "viewing", "reservation", "quote", "part-exchange"]),
  reason: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    // (Fix 2 / security) Customer iron-session was the wrong auth here —
    // it gated the route on admin login, so the only people who could
    // cancel were admins, and any admin could cancel anyone's booking.
    // Cancellation is a customer-initiated action; switch to the
    // customer Auth.js session and scope by the email on the booking.
    const customer = await getCustomerIdentity();
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = cancelSchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const path = firstIssue?.path?.join(".") ?? "body";
      return NextResponse.json(
        {
          error: `Invalid ${path}: ${firstIssue?.message ?? "validation failed"}`,
        },
        { status: 400 }
      );
    }
    const { bookingReference, type, reason } = parsed.data;

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Cancellation reason must be at least 10 characters" },
        { status: 400 }
      );
    }

    let booking;
    let collection;

    if (type === "service") {
      collection = await getServiceAppointmentsCollection();
      booking = await collection.findOne({ bookingReference });
    } else if (type === "viewing") {
      collection = await getCarViewingBookingsCollection();
      booking = await collection.findOne({ bookingReference });
    } else {
      // reservation / quote / part-exchange aren't wired through this
      // route yet — the zod enum still accepts them so the validation
      // error tells the client "wrong type for this endpoint" instead
      // of swallowing the request as a generic 400.
      return NextResponse.json(
        { error: "Invalid booking type" },
        { status: 400 }
      );
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // (Fix 2 / security) Even with a valid reference, only the booking's
    // owner gets to cancel it. Case-insensitive on the customer email
    // because `getCustomerIdentity()` lowercases the account email but
    // legacy bookings predate that normalisation.
    const bookingEmail = booking.customerInfo?.email ?? "";
    if (bookingEmail.toLowerCase() !== customer.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Compare-and-set so two simultaneous cancels don't both fire the email
    // and overwrite each other's audit fields.
    // Only the first request whose updateOne actually transitions the row
    // gets to send the cancellation email.
    const updateResult = await collection.updateOne(
      { bookingReference, status: { $ne: "cancelled" } },
      {
        $set: {
          status: "cancelled",
          cancellationReason: reason,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.modifiedCount !== 1) {
      // Another request just cancelled it. Treat as success-shaped — the
      // booking is in the desired terminal state — but skip the email.
      return NextResponse.json({
        success: true,
        message: "Booking already cancelled",
      });
    }

    // Send cancellation email in the background after responding
    const customerEmail = booking.customerInfo.email;
    waitUntil(
      (async () => {
        try {
          const shopInfo = await getBusinessInfo();
          const updatedBooking = { ...booking, cancellationReason: reason };
          const emailShopInfo = {
            businessName: shopInfo.businessName,
            phone: shopInfo.phone,
            email: shopInfo.email,
            address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
          };

          const emailResult = await sendEmail({
            to: customerEmail,
            subject: `Booking Cancellation - ${bookingReference}`,
            react: React.createElement(BookingCancellation, {
              booking: updatedBooking,
              bookingType: type as "service" | "viewing",
              shopInfo: emailShopInfo,
            }),
          });

          if (!emailResult.success) {
            logEvent("booking.cancel.email_send_failed", {
              error: String(emailResult.error),
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/bookings/cancel",
            op: "send_cancellation_email",
          });
        }
      })()
    );

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully and customer notified",
    });
  } catch (error) {
    logError(error, { route: "POST /api/bookings/cancel" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
