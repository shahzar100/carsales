import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  serializeDocument,
} from "@/lib/models";
import { getSession, isAuthenticated } from "@/lib/utils/auth";
import { ObjectId, Document } from "mongodb";
import { recordAudit } from "@/lib/utils/audit";
import {
  badRequest,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
      200
    );
    const skip = (page - 1) * limit;

    const serviceCollection = await getServiceAppointmentsCollection();
    const viewingCollection = await getCarViewingBookingsCollection();

    const [serviceBookings, viewingBookings, totalService, totalViewing] =
      await Promise.all([
        serviceCollection
          .find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        viewingCollection
          .find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        serviceCollection.countDocuments({}),
        viewingCollection.countDocuments({}),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        serviceBookings: serviceBookings.map((b) => serializeDocument(b)),
        viewingBookings: viewingBookings.map((b) => serializeDocument(b)),
      },
      pagination: {
        page,
        limit,
        totalService,
        totalViewing,
      },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/bookings" });
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }

    const body = await request.json();
    const { bookingId: _bookingId, status, type } = body;

    if (!_bookingId || !status || !type) {
      return NextResponse.json(
        {
          error: "Missing required fields: bookingId, status, type",
          received: { bookingId: _bookingId, status, type },
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
      return badRequest("Invalid type. Must be 'service' or 'viewing'");
    }

    // Get the appropriate collection
    const collection =
      type === "service"
        ? await getServiceAppointmentsCollection()
        : await getCarViewingBookingsCollection();

    // Convert bookingId to ObjectId
    let objectId;
    try {
      objectId = ObjectId.createFromHexString(String(_bookingId));
    } catch (_err) {
      return badRequest("Invalid booking ID format");
    }

    // Update the booking status
    // Use MongoDB's generic Document type for compatibility with ObjectId
    const genericCollection = collection as unknown as {
      updateOne: (
        filter: Document,
        update: Document
      ) => Promise<{ matchedCount: number; modifiedCount: number }>;
      findOne: (filter: Document) => Promise<Document | null>;
    };

    // Build the $set payload — add completedAt when marking as completed
    const $set: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (status === "completed") {
      $set.completedAt = new Date();
    }

    const result = await genericCollection.updateOne(
      { _id: objectId },
      { $set }
    );

    if (result.matchedCount === 0) {
      return notFound("Booking not found");
    }

    if (result.modifiedCount === 0) {
      return badRequest("Booking status was not updated");
    }

    // Get the updated booking
    const updatedBooking = await genericCollection.findOne({
      _id: objectId,
    });

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: `booking.${status}`,
      targetType: type === "service" ? "booking" : "viewing",
      targetId: String(_bookingId),
      metadata: { type, newStatus: status },
    });

    return NextResponse.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: updatedBooking ? serializeDocument(updatedBooking) : null,
    });
  } catch (error) {
    logError(error, { route: "PUT /api/admin/bookings" });
    return serverError();
  }
}
