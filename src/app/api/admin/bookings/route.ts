import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceCollection = await getServiceAppointmentsCollection();
    const viewingCollection = await getCarViewingBookingsCollection();

    const serviceBookings = await serviceCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const viewingBookings = await viewingCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        serviceBookings,
        viewingBookings,
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, status, type } = body;

    // Debug logging
    console.log("PUT request body:", { bookingId, status, type });

    if (!bookingId || !status || !type) {
      return NextResponse.json(
        {
          error: "Missing required fields: bookingId, status, type",
          received: { bookingId, status, type },
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: " + validStatuses.join(", "),
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["service", "viewing"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'service' or 'viewing'" },
        { status: 400 }
      );
    }

    // Get the appropriate collection
    const collection =
      type === "service"
        ? await getServiceAppointmentsCollection()
        : await getCarViewingBookingsCollection();

    // Convert bookingId to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(String(bookingId));
    } catch (err) {
      console.error("Invalid booking ID format:", err);
      return NextResponse.json(
        { error: "Invalid booking ID format" },
        { status: 400 }
      );
    }

    // Update the booking status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await collection.updateOne({ _id: objectId } as any, {
      $set: {
        status: status,
        updatedAt: new Date(),
      },
    });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Booking status was not updated" },
        { status: 400 }
      );
    }

    // Get the updated booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedBooking = await collection.findOne({
      _id: objectId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return NextResponse.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
