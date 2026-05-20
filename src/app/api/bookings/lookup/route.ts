import { NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import {
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  getQuotesCollection,
  serializeDocument,
} from "@/lib/models";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { validateBookingReference } from "@/lib/utils/validation";
import { logError } from "@/lib/utils/observability";
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
    const ip = ipAddress(request) || "unknown";
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
    const turnstileToken = searchParams.get("turnstileToken");

    if (!ref) {
      return badRequest("Booking reference is required");
    }

    // Validate reference format — BK-XXXXXX (service / viewing booking)
    // or QT-XXXXXX (quote request).
    if (!validateBookingReference(ref)) {
      return badRequest("Invalid booking reference format");
    }

    if (!email || typeof email !== "string") {
      return badRequest("Email address is required for verification");
    }

    // CAPTCHA — no-op when TURNSTILE_SECRET_KEY is unset (dev/test) and
    // a hard fail in production via verifyTurnstileToken's own guard.
    // The bookingReference + email pair is already a bearer secret for
    // emailed lookup links, so verification only meaningfully gates the
    // manual-form path; URL-driven recipients won't have a token but
    // will be rate-limited per-IP regardless. (Fix 2.5, finding #16.)
    const captcha = await verifyTurnstileToken(turnstileToken, ip);
    if (!captcha.ok) {
      return badRequest("CAPTCHA verification failed");
    }

    // Quote requests (QT-XXXXXX) live in their own collection and have no
    // appointment slot — look them up separately from bookings.
    if (ref.startsWith("QT-")) {
      const quotesCollection = await getQuotesCollection();
      const quote = await quotesCollection.findOne({ quoteReference: ref });
      if (
        !quote ||
        quote.customerInfo?.email?.toLowerCase() !== email.toLowerCase()
      ) {
        return notFound("Booking not found");
      }
      return ok({ type: "quote", booking: serializeDocument(quote) });
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
    logError(error, { route: "GET /api/bookings/lookup" });
    return serverError();
  }
}
