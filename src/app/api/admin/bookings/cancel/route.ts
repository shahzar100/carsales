import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { waitUntil } from "@vercel/functions";
import React from "react";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { isAuthenticated } from "@/lib/utils/auth";
import { sendEmail } from "@/emails/send";
import { BookingCancellation } from "@/emails/BookingCancellation";
import { logError, logEvent } from "@/lib/utils/observability";

// Mirror of the public `/api/bookings/cancel` schema. Kept verbatim so
// the two routes stay structurally identical — if a field tightens on
// the customer side, this side should follow.
const cancelSchema = z.object({
  bookingReference: z.string().regex(/^BK-[A-Z0-9]{6}$/i),
  type: z.enum(["service", "viewing", "reservation", "quote", "part-exchange"]),
  reason: z.string().min(1).max(500),
});

// Admin-side counterpart to /api/bookings/cancel. The customer route
// scopes cancellation to the booking owner's email; admins need to be
// able to cancel any booking from the dashboard. Auth is the admin
// iron-session (same gate as the rest of /api/admin/**).
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
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
      return NextResponse.json(
        { error: "Invalid booking type" },
        { status: 400 }
      );
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

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
      return NextResponse.json({
        success: true,
        message: "Booking already cancelled",
      });
    }

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
            logEvent("admin.booking.cancel.email_send_failed", {
              error: String(emailResult.error),
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/admin/bookings/cancel",
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
    logError(error, { route: "POST /api/admin/bookings/cancel" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
