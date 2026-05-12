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
  getServiceAppointmentsCollection,
  ServiceAppointment,
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
import { ServiceBookingConfirmation } from "@/emails/ServiceBookingConfirmation";
import { logError } from "@/lib/utils/observability";
import React from "react";

// CODEBASE_ISSUES C12, D1: structural validation up front.
const serviceSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().min(1).max(254),
    phone: z.string().min(1).max(20),
  }),
  serviceType: z.string().min(1).max(100),
  serviceDetails: z.string().max(500).optional().default(""),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().min(1).max(10),
  // (#17) Optional — server-side verifier no-ops without a secret.
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - max 5 requests per minute per IP
    const ip = ipAddress(request) || "unknown";
    const rateLimit = await checkRateLimit(`service-booking:${ip}`, 5, 60000);

    if (!rateLimit.allowed) {
      return tooManyRequests("Too many requests. Please try again later.");
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }

    const parsed = serviceSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid request body"
      );
    }
    const body = parsed.data;

    // (#17) CAPTCHA check
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
    const serviceCollection = await getServiceAppointmentsCollection();

    const newBooking: Omit<ServiceAppointment, "_id"> = {
      bookingReference,
      customerInfo: {
        name: sanitizeName(body.customerInfo.name),
        email: emailValidation.sanitized,
        phone: phoneValidation.sanitized,
      },
      // Length is enforced by the Zod schema above; no further sanitisation
      // needed — React escapes on render. (#4)
      serviceType: body.serviceType,
      serviceDetails: body.serviceDetails || "",
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await serviceCollection.insertOne(newBooking as ServiceAppointment);
    } catch (err: unknown) {
      // The new partial-unique index `uniq_active_service_slot`
      // (CODEBASE_ISSUES C3) throws E11000 if the slot was just taken.
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
            subject: `Service Booking Confirmation - ${bookingReference}`,
            react: React.createElement(ServiceBookingConfirmation, {
              booking: newBooking as ServiceAppointment,
              shopInfo: emailShopInfo,
            }),
          });

          if (!emailResult.success) {
            logError(emailResult.error, {
              route: "POST /api/bookings/service",
              action: "email_send_failed",
              bookingReference,
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/bookings/service",
            action: "email_throw",
            bookingReference,
          });
        }
      })()
    );

    return ok({
      bookingReference,
      message:
        "Service booking created successfully. Check your email for confirmation.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/bookings/service" });
    return serverError();
  }
}
