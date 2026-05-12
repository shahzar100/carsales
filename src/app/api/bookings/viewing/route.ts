import { NextRequest } from "next/server";
import { z } from "zod";
import {
  ok,
  badRequest,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { waitUntil } from "@vercel/functions";
import { ipAddress } from "@vercel/functions";
import {
  getCarViewingBookingsCollection,
  CarViewingBooking,
} from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { generateBookingReference } from "@/lib/utils/booking";
import {
  validateEmail,
  validatePhone,
  sanitizeName,
  validateFutureDate,
  validateAppointmentTime,
  checkRateLimit,
} from "@/lib/utils/validation";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { sendEmail } from "@/emails/send";
import { CarViewingConfirmation } from "@/emails/CarViewingConfirmation";
import { logError } from "@/lib/utils/observability";
import React from "react";

// CODEBASE_ISSUES C12, D1: structured validation. Replaces a body:any with
// loose manual checks. carDetails fields are accepted as either string or
// number for backward compatibility with the existing client; year is
// coerced to int and bounded.
const currentYear = new Date().getFullYear();
const viewingSchema = z.object({
  carId: z.string().min(1).max(64),
  carDetails: z.object({
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.coerce.number().int().min(1900).max(currentYear + 1),
    price: z.coerce.number().min(0),
    image: z.string().max(500).optional().default(""),
  }),
  customerInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().min(1).max(254),
    phone: z.string().min(1).max(20),
  }),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().min(1).max(10),
  // CarViewingBooking.dealership is `{ location, address }` per the
  // interface. Accept either the structured shape or omit entirely.
  dealership: z
    .object({
      location: z.string().max(100),
      address: z.string().max(200),
    })
    .optional(),
  // (#17) Optional so the route still works when Turnstile isn't
  // configured locally; the server-side verifier handles the prod
  // contract (verifyTurnstileToken returns ok:true if no secret set).
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = ipAddress(request) || "unknown";
    const rateLimit = await checkRateLimit(`viewing-booking:${ip}`, 5, 60000);

    if (!rateLimit.allowed) {
      return tooManyRequests("Too many requests. Please try again later.");
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }

    const parsed = viewingSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid request body"
      );
    }
    const body = parsed.data;

    // (#17) CAPTCHA check before doing any DB / email work.
    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return badRequest("CAPTCHA verification failed. Please try again.");
    }

    const emailValidation = validateEmail(body.customerInfo.email);
    if (!emailValidation.valid) {
      return badRequest("Invalid email address");
    }

    const phoneValidation = validatePhone(body.customerInfo.phone);
    if (!phoneValidation.valid) {
      return badRequest("Invalid phone number");
    }

    if (!validateFutureDate(body.appointmentDate)) {
      return badRequest(
        "Appointment date must be in the future and within one year"
      );
    }

    if (!validateAppointmentTime(body.appointmentTime)) {
      return badRequest("Invalid appointment time");
    }

    const bookingReference = generateBookingReference();
    const viewingCollection = await getCarViewingBookingsCollection();

    // (Day 12 / Fix 12.7) If the client didn't send a dealership, fall
    // back to the shop's single showroom. The plan's preferred long-term
    // path is to drop the field after a deprecation window; until then,
    // this keeps every viewing row populated without making the form
    // think about it.
    let dealership = body.dealership;
    if (!dealership) {
      try {
        const shop = await getBusinessInfo();
        dealership = {
          location: shop?.businessName ?? "Showroom",
          address: shop
            ? [shop.address, shop.city, shop.zipCode].filter(Boolean).join(", ")
            : "",
        };
      } catch {
        dealership = { location: "Showroom", address: "" };
      }
    }

    const newBooking: Omit<CarViewingBooking, "_id"> = {
      bookingReference,
      carId: body.carId,
      carDetails: {
        make: body.carDetails.make,
        model: body.carDetails.model,
        year: body.carDetails.year,
        price: body.carDetails.price,
        image: body.carDetails.image || "",
      },
      customerInfo: {
        name: sanitizeName(body.customerInfo.name),
        email: emailValidation.sanitized,
        phone: phoneValidation.sanitized,
      },
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      dealership,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await viewingCollection.insertOne(newBooking as CarViewingBooking);
    } catch (err: unknown) {
      // The new partial-unique index `uniq_active_viewing_slot` (CODEBASE_ISSUES C3)
      // throws E11000 if the slot was just taken by a concurrent booking.
      // Translate to a 409 with a friendly message.
      if (
        err &&
        typeof err === "object" &&
        (err as { code?: number }).code === 11000
      ) {
        return tooManyRequests(
          "That slot was just taken — please pick another time."
        );
      }
      throw err;
    }

    // Send confirmation email in the background after responding
    waitUntil(
      (async () => {
        try {
          const shopInfo = await getBusinessInfo();
          const emailShopInfo = {
            businessName: shopInfo.businessName,
            phone: shopInfo.phone,
            email: shopInfo.email,
            address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
          };

          const emailResult = await sendEmail({
            to: body.customerInfo.email,
            subject: `🚗 Car Viewing Confirmation - ${bookingReference}`,
            react: React.createElement(CarViewingConfirmation, {
              booking: newBooking as CarViewingBooking,
              shopInfo: emailShopInfo,
            }),
          });

          if (!emailResult.success) {
            logError(emailResult.error, {
              route: "POST /api/bookings/viewing",
              action: "email_send_failed",
              bookingReference,
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/bookings/viewing",
            action: "email_throw",
            bookingReference,
          });
        }
      })()
    );

    return ok({
      bookingReference,
      message:
        "Car viewing booking created successfully. Check your email for confirmation.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/bookings/viewing" });
    return serverError();
  }
}
