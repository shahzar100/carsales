import { NextRequest, NextResponse } from "next/server";
import { getServiceAppointmentsCollection, getCarViewingBookingsCollection } from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
