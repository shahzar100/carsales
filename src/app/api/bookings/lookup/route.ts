import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json(
        { error: "Booking reference is required" },
        { status: 400 }
      );
    }

    const serviceCollection = await getServiceAppointmentsCollection();
    const viewingCollection = await getCarViewingBookingsCollection();

    const serviceBooking = await serviceCollection.findOne({
      bookingReference: ref,
    });
    const viewingBooking = await viewingCollection.findOne({
      bookingReference: ref,
    });

    if (!serviceBooking && !viewingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        type: serviceBooking ? "service" : "viewing",
        booking: serviceBooking || viewingBooking,
      },
    });
  } catch (error) {
    console.error("Error looking up booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
