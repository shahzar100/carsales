import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  serializeDocument,
} from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";

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
    const { allowed, resetIn } = lookupLimiter.check(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many lookup attempts. Please try again later." },
        {
          status: 429,
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
      return NextResponse.json(
        { error: "Booking reference is required" },
        { status: 400 }
      );
    }

    // Validate booking reference format (BK-XXXXXX)
    if (!/^BK-[A-Z0-9]{6}$/i.test(ref)) {
      return NextResponse.json(
        { error: "Invalid booking reference format" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required for verification" },
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

    const booking = serviceBooking || viewingBooking;

    // Verify email matches — return generic error to prevent enumeration
    const bookingEmail = booking?.customerInfo?.email || booking?.email;
    if (!booking || bookingEmail?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        type: serviceBooking ? "service" : "viewing",
        booking: serializeDocument(booking),
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
