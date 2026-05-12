import { NextRequest } from "next/server";
import { z } from "zod";
import {
  ok,
  badRequest,
  notFound,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { waitUntil, ipAddress } from "@vercel/functions";
import { ObjectId } from "mongodb";
import {
  getReservationsCollection,
  getCarsCollection,
  Reservation,
} from "@/lib/models";
import { revalidatePath } from "next/cache";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { generateReservationReference } from "@/lib/utils/booking";
import {
  validateEmail,
  validatePhone,
  sanitizeName,
  checkRateLimit,
} from "@/lib/utils/validation";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { sendEmail } from "@/emails/send";
import { logError } from "@/lib/utils/observability";
import React from "react";
import { ReservationConfirmation } from "@/emails/ReservationConfirmation";

/**
 * (#30) POST a new reservation.
 *
 * Workflow:
 *   1. Customer fills the form on the car detail page.
 *   2. We create a `pending` reservation that expires in 48 hours.
 *   3. Admin sees it in the dashboard, calls the customer.
 *   4. Customer brings cash to the showroom — admin marks it `confirmed`.
 *   5. If no one shows up, the TTL index auto-expires it after 48 hours.
 *
 * Only one active reservation per car at a time (uniq partial index).
 * No payment integration — deposits are handled in person.
 */
const RESERVATION_TTL_HOURS = 48;

const reservationSchema = z.object({
  carId: z.string().min(1).max(64),
  customerInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().min(1).max(254),
    phone: z.string().min(1).max(20),
  }),
  notes: z.string().max(500).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────
    const ip = ipAddress(request) || "unknown";
    const rateLimit = await checkRateLimit(`reservation:${ip}`, 3, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return tooManyRequests("Too many requests. Please try again later.");
    }

    // ── Parse body ─────────────────────────────────────────
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }
    const parsed = reservationSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid request body"
      );
    }
    const body = parsed.data;

    // ── CAPTCHA ────────────────────────────────────────────
    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return badRequest("CAPTCHA verification failed. Please try again.");
    }

    // ── Domain-level validation ────────────────────────────
    const emailValidation = validateEmail(body.customerInfo.email);
    if (!emailValidation.valid) return badRequest("Invalid email address");
    const phoneValidation = validatePhone(body.customerInfo.phone);
    if (!phoneValidation.valid) return badRequest("Invalid phone number");

    if (!ObjectId.isValid(body.carId)) {
      return badRequest("Invalid car ID");
    }

    // ── Load car + verify it's reservable ──────────────────
    const carsColl = await getCarsCollection();
    const car = await carsColl.findOne({
      _id: ObjectId.createFromHexString(body.carId) as never,
    });
    if (!car) return notFound("Car not found");
    if (car.status !== "available") {
      return badRequest(
        car.status === "reserved"
          ? "This car is already reserved."
          : "This car is no longer available."
      );
    }

    // ── Create reservation ─────────────────────────────────
    const reservationReference = generateReservationReference();
    const reservationsColl = await getReservationsCollection();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + RESERVATION_TTL_HOURS * 60 * 60 * 1000
    );

    const newReservation: Omit<Reservation, "_id"> = {
      reservationReference,
      carId: body.carId,
      carDetails: {
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        image: car.image,
      },
      customerInfo: {
        name: sanitizeName(body.customerInfo.name),
        email: emailValidation.sanitized,
        phone: phoneValidation.sanitized,
      },
      notes: body.notes,
      status: "pending",
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await reservationsColl.insertOne(newReservation as Reservation);
    } catch (err) {
      // Partial-unique index throws E11000 if a concurrent reservation
      // beat us to this car.
      if (
        err &&
        typeof err === "object" &&
        (err as { code?: number }).code === 11000
      ) {
        return badRequest(
          "This car was just reserved by someone else. Please call us if you're still interested."
        );
      }
      throw err;
    }

    // Flip car to `reserved` so it stops showing as available.
    await carsColl.updateOne(
      { _id: car._id },
      { $set: { status: "reserved", updatedAt: now } }
    );

    // Invalidate fleet cache so customers see the new status.
    revalidatePath("/BrowseFleet");
    revalidatePath(`/BrowseFleet/${body.carId}`);

    // ── Confirmation email (background) ────────────────────
    waitUntil(
      (async () => {
        try {
          const shopInfo = await getBusinessInfo();
          const emailResult = await sendEmail({
            to: emailValidation.sanitized,
            subject: `Reservation confirmed — ${reservationReference}`,
            react: React.createElement(ReservationConfirmation, {
              reservation: { ...newReservation, reservationReference },
              shopInfo: {
                businessName: shopInfo.businessName,
                phone: shopInfo.phone,
                email: shopInfo.email,
                address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
              },
            }),
          });
          if (!emailResult.success) {
            logError(emailResult.error, {
              route: "POST /api/bookings/reservation",
              action: "email_send_failed",
              reservationReference,
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/bookings/reservation",
            action: "email_throw",
            reservationReference,
          });
        }
      })()
    );

    return ok({
      reservationReference,
      expiresAt: expiresAt.toISOString(),
      message:
        "Reservation created. We'll call you shortly to arrange your visit — please bring cash for the deposit.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/bookings/reservation" });
    return serverError();
  }
}
