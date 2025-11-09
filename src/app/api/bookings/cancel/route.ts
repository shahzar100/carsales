import { NextRequest, NextResponse } from "next/server";
import { getServiceAppointmentsCollection, getCarViewingBookingsCollection, getShopInfoCollection } from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { sendEmail } from "@/lib/email/client";
import { createBookingCancellationEmail } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingReference, type, reason } = body;

    if (!bookingReference || !type || !reason) {
      return NextResponse.json(
        { error: "Booking reference, type, and cancellation reason are required" },
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
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
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
        businessName: "Car Sales & Viewing",
        address: "123 Auto Street",
        city: "City",
        state: "State",
        zipCode: "12345",
        phone: "(555) 123-4567",
        email: "info@carsales.com",
      } as any;
    }

    // Send cancellation email
    const updatedBooking = { ...booking, cancellationReason: reason };
    const emailHtml = createBookingCancellationEmail(
      updatedBooking,
      type as "service" | "viewing",
      {
        businessName: shopInfo.businessName,
        phone: shopInfo.phone,
        email: shopInfo.email,
        address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
      }
    );

    await sendEmail({
      to: booking.customerInfo.email,
      subject: `Booking Cancellation - ${bookingReference}`,
      html: emailHtml,
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
