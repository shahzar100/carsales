import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  getShopInfoCollection,
} from "@/lib/models";
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
    const shopCollection = await getShopInfoCollection();
    let shopInfo = await shopCollection.findOne({});

    if (!shopInfo) {
      shopInfo = {
        _id: "default",
        businessName: process.env.NEXT_BUSINESS_NAME || "Car Sales & Viewing",
        address: process.env.NEXT_BUSINESS_ADDRESS || "123 Auto Street",
        city: process.env.NEXT_BUSINESS_CITY || "City",
        state: process.env.NEXT_BUSINESS_STATE || "State",
        zipCode: process.env.NEXT_BUSINESS_ZIP || "12345",
        phone: process.env.NEXT_BUSINESS_PHONE || "(555) 123-4567",
        email: process.env.NEXT_BUSINESS_EMAIL || "info@carsales.com",
        hours: {
          monday: "9:00 AM - 6:00 PM",
          tuesday: "9:00 AM - 6:00 PM",
          wednesday: "9:00 AM - 6:00 PM",
          thursday: "9:00 AM - 6:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "9:00 AM - 4:00 PM",
          sunday: "Closed",
        },
        updatedAt: new Date(),
      };
    }

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
