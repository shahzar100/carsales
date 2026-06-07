import { NextRequest } from "next/server";
import { z } from "zod";
import { ipAddress } from "@vercel/functions";
import {
  ok,
  badRequest,
  notFound,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
} from "@/lib/models";
import {
  validateEmail,
  validateBookingReference,
  checkRateLimit,
} from "@/lib/utils/validation";
import { logError } from "@/lib/utils/observability";

// Customer self-service cancellation. Matches a booking by its reference
// AND the email on record (generic 404 on mismatch to prevent enumeration),
// then flips it to `cancelled` with the supplied reason.
const cancelSchema = z.object({
  bookingReference: z.string().min(1).max(20),
  email: z.string().min(1).max(254),
  reason: z.string().min(10).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const ip = ipAddress(request) || "unknown";
    // 5 cancellations per hour per IP.
    const rateLimit = await checkRateLimit(
      `customer-cancel:${ip}`,
      5,
      60 * 60 * 1000
    );
    if (!rateLimit.allowed) {
      return tooManyRequests(
        "Too many cancellation attempts. Please try again later."
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }

    const parsed = cancelSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      // Surface the friendliest message for the common cases.
      if (issue?.path[0] === "reason") {
        return badRequest("Cancellation reason must be at least 10 characters");
      }
      return badRequest(issue?.message ?? "Invalid request body");
    }
    const body = parsed.data;

    if (!validateBookingReference(body.bookingReference)) {
      return badRequest("Valid booking reference is required");
    }

    const emailValidation = validateEmail(body.email);
    if (!emailValidation.valid) {
      return badRequest("Invalid email address");
    }

    // Search both booking collections for the reference.
    const serviceCollection = await getServiceAppointmentsCollection();
    const viewingCollection = await getCarViewingBookingsCollection();

    const serviceBooking = await serviceCollection.findOne({
      bookingReference: body.bookingReference,
    });
    const viewingBooking = await viewingCollection.findOne({
      bookingReference: body.bookingReference,
    });

    const booking = serviceBooking ?? viewingBooking;
    const collection = serviceBooking ? serviceCollection : viewingCollection;

    // Verify email matches — generic 404 to prevent enumeration.
    if (
      !booking ||
      booking.customerInfo?.email?.toLowerCase() !==
        emailValidation.sanitized.toLowerCase()
    ) {
      return notFound("Booking not found");
    }

    if (booking.status === "cancelled") {
      return badRequest("This booking is already cancelled");
    }

    if (booking.status === "completed") {
      return badRequest("Completed bookings cannot be cancelled");
    }

    // Compare-and-set on status so two concurrent cancels can't both write
    // (the app-level checks above are TOCTOU on their own). Idempotent: if the
    // row was already terminal we simply matched nothing.
    await collection.updateOne(
      {
        bookingReference: body.bookingReference,
        status: { $nin: ["cancelled", "completed"] },
      },
      {
        $set: {
          status: "cancelled",
          cancellationReason: body.reason,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return ok({
      message: "Your booking has been cancelled successfully.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/bookings/customer-cancel" });
    return serverError();
  }
}
