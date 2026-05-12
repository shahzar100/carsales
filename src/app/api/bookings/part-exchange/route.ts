import { NextRequest } from "next/server";
import { z } from "zod";
import {
  ok,
  badRequest,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { waitUntil, ipAddress } from "@vercel/functions";
import { getPartExchangesCollection, PartExchange } from "@/lib/models";
import { generatePartExchangeReference } from "@/lib/utils/booking";
import {
  validateEmail,
  validatePhone,
  sanitizeName,
  checkRateLimit,
} from "@/lib/utils/validation";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { logError } from "@/lib/utils/observability";
import { sendEmail } from "@/emails/send";
import React from "react";
import { PartExchangeConfirmation } from "@/emails/PartExchangeConfirmation";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

/**
 * (#31) POST a part-exchange enquiry.
 *
 * The customer fills in their current car details; admin comes back
 * within 24 hours with an indicative valuation. No real valuation
 * machinery wired up — that's a manual step for the sales team.
 *
 * Conventions match the other booking endpoints: Zod validation,
 * Turnstile + per-IP rate limit, background email, structured logs.
 */
const currentYear = new Date().getFullYear();

const partExchangeSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().min(1).max(254),
    phone: z.string().min(1).max(20),
  }),
  vehicle: z.object({
    registration: z.string().max(20).optional(),
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.coerce.number().int().min(1980).max(currentYear + 1),
    mileage: z.coerce.number().int().min(0).max(1_000_000),
    condition: z.enum(["Excellent", "Good", "Fair", "Poor"]),
    serviceHistory: z.enum(["Full", "Partial", "None"]).optional(),
    notes: z.string().max(1000).optional(),
  }),
  interestedInCarId: z.string().max(64).optional(),
  interestedInCarLabel: z.string().max(200).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = ipAddress(request) || "unknown";
    const rateLimit = await checkRateLimit(`part-exchange:${ip}`, 3, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return tooManyRequests("Too many requests. Please try again later.");
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }
    const parsed = partExchangeSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid request body"
      );
    }
    const body = parsed.data;

    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return badRequest("CAPTCHA verification failed. Please try again.");
    }

    const emailValidation = validateEmail(body.customerInfo.email);
    if (!emailValidation.valid) return badRequest("Invalid email address");
    const phoneValidation = validatePhone(body.customerInfo.phone);
    if (!phoneValidation.valid) return badRequest("Invalid phone number");

    const enquiryReference = generatePartExchangeReference();
    const coll = await getPartExchangesCollection();
    const now = new Date();

    const newEnquiry: Omit<PartExchange, "_id"> = {
      enquiryReference,
      interestedInCarId: body.interestedInCarId,
      interestedInCarLabel: body.interestedInCarLabel,
      customerInfo: {
        name: sanitizeName(body.customerInfo.name),
        email: emailValidation.sanitized,
        phone: phoneValidation.sanitized,
      },
      vehicle: {
        registration: body.vehicle.registration?.toUpperCase().trim(),
        make: body.vehicle.make,
        model: body.vehicle.model,
        year: body.vehicle.year,
        mileage: body.vehicle.mileage,
        condition: body.vehicle.condition,
        serviceHistory: body.vehicle.serviceHistory,
        notes: body.vehicle.notes,
      },
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await coll.insertOne(newEnquiry as PartExchange);

    // Background confirmation email
    waitUntil(
      (async () => {
        try {
          const shopInfo = await getBusinessInfo();
          const result = await sendEmail({
            to: emailValidation.sanitized,
            subject: `Part-exchange enquiry received — ${enquiryReference}`,
            react: React.createElement(PartExchangeConfirmation, {
              enquiry: { ...newEnquiry, enquiryReference },
              shopInfo: {
                businessName: shopInfo.businessName,
                phone: shopInfo.phone,
                email: shopInfo.email,
                address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
              },
            }),
          });
          if (!result.success) {
            logError(result.error, {
              route: "POST /api/bookings/part-exchange",
              action: "email_send_failed",
              enquiryReference,
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/bookings/part-exchange",
            action: "email_throw",
            enquiryReference,
          });
        }
      })()
    );

    return ok({
      enquiryReference,
      message:
        "Thanks! We'll come back to you with an indicative valuation within 24 hours.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/bookings/part-exchange" });
    return serverError();
  }
}
