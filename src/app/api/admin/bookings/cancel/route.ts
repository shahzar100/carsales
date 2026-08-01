import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { waitUntil, ipAddress } from "@vercel/functions";
import React from "react";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { hasMinimumRole } from "@/lib/utils/auth";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { sendEmail } from "@/emails/send";
import { BookingCancellation } from "@/emails/BookingCancellation";
import { logError, logEvent } from "@/lib/utils/observability";

// Admin cancel fires a customer email — bound the worst case of a
// compromised admin session being used as a transactional email cannon.
// 30 / 5 min per IP is plenty for batch cleanups, painful for a flood.
const adminCancelLimiter = createRateLimiter("admin-booking-cancel", {
  maxRequests: 30,
  windowMs: 5 * 60 * 1000,
});

// Mirror of the public `/api/bookings/cancel` schema. Kept in sync so
// the two routes stay structurally identical — the `type` enum is scoped
// to the only two kinds this endpoint can cancel (service + viewing, both
// BK-referenced). Reservations/quotes/part-exchange have no cancel path
// here, matching the customer route and the BK-/QT-only lookup.
const cancelSchema = z.object({
  bookingReference: z.string().regex(/^BK-[A-Z0-9]{6}$/i),
  type: z.enum(["service", "viewing"]),
  reason: z.string().min(1).max(500),
});

// Admin-side counterpart to /api/bookings/cancel. The customer route
// scopes cancellation to the booking owner's email; admins need to be
// able to cancel any booking from the dashboard. Auth is the admin
// iron-session (same gate as the rest of /api/admin/**).
export async function POST(request: NextRequest) {
  try {
    if (!(await hasMinimumRole("manager"))) {
      return NextResponse.json(
        { error: "Forbidden — manager role required" },
        { status: 403 }
      );
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await adminCancelLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
        }
      );
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
      // Unreachable — the zod enum only admits service/viewing. Kept so
      // TypeScript can prove `collection` is assigned and as a defensive
      // 400 if the enum ever widens without a matching branch.
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
