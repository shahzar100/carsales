import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { isAuthenticated } from "@/lib/utils/auth";
import { sendEmail } from "@/emails/send";
import { BookingCancellation } from "@/emails/BookingCancellation";
import React from "react";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingReference, type, reason } = body;

    if (!bookingReference || !type || !reason) {
      return NextResponse.json(
        {
          error:
            "Booking reference, type, and cancellation reason are required",
        },
        { status: 400 }
      );
    }

    if (reason.length < 10) {
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

    // Update booking status
    await collection.updateOne(
      { bookingReference },
      {
        $set: {
          status: "cancelled",
          cancellationReason: reason,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Get shop info for email
    const shopInfo = await getBusinessInfo();

    // Send cancellation email
    const updatedBooking = { ...booking, cancellationReason: reason };
    const emailShopInfo = {
      businessName: shopInfo.businessName,
      phone: shopInfo.phone,
      email: shopInfo.email,
      address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
    };

    await sendEmail({
      to: booking.customerInfo.email,
      subject: `Booking Cancellation - ${bookingReference}`,
      react: React.createElement(BookingCancellation, {
        booking: updatedBooking,
        bookingType: type as "service" | "viewing",
        shopInfo: emailShopInfo,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully and customer notified",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
