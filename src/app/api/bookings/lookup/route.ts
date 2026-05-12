import { NextRequest } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  serializeDocument,
} from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import {
  ok,
  badRequest,
  notFound,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";

// 10 lookups per 15-minute window per IP
const lookupLimiter = createRateLimiter("bookingLookup", {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
});

export async function GET(request: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { allowed, resetIn } = await lookupLimiter.check(ip);

    if (!allowed) {
      return tooManyRequests(
        "Too many lookup attempts. Please try again later.",
        {
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");
    const email = searchParams.get("email");

    if (!ref) {
      return badRequest("Booking reference is required");
    }

    // Validate booking reference format (BK-XXXXXX)
    if (!/^BK-[A-Z0-9]{6}$/i.test(ref)) {
      return badRequest("Invalid booking reference format");
    }

    if (!email || typeof email !== "string") {
      return badRequest("Email address is required for verification");
    }

    const serviceCollection = await getServiceAppointmentsCollection();
    const viewingCollection = await getCarViewingBookingsCollection();

    const serviceBooking = await serviceCollection.findOne({
      bookingReference: ref,
    });
    const viewingBooking = await viewingCollection.findOne({
      bookingReference: ref,
    });

    const booking = serviceBooking || viewingBooking;

    // Verify email matches — return generic error to prevent enumeration
    const bookingEmail = booking?.customerInfo?.email;
    if (!booking || bookingEmail?.toLowerCase() !== email.toLowerCase()) {
      return notFound("Booking not found");
    }

    return ok({
      type: serviceBooking ? "service" : "viewing",
      booking: serializeDocument(booking),
    });
  } catch (error) {
    console.error("Error looking up booking:", error);
    return serverError();
  }
}
