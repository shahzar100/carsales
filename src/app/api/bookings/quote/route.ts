import { NextRequest } from "next/server";
import { z } from "zod";
import {
  ok,
  badRequest,
  unauthorized,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { getCustomerIdentity } from "@/lib/utils/customerAuth";
import { waitUntil } from "@vercel/functions";
import { ipAddress } from "@vercel/functions";
import { getQuotesCollection, Quote } from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { generateQuoteReference } from "@/lib/utils/booking";
import {
  validateEmail,
  validatePhone,
  sanitizeName,
  checkRateLimit,
} from "@/lib/utils/validation";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { sendEmail } from "@/emails/send";
import { QuoteConfirmation } from "@/emails/QuoteConfirmation";
import { logError } from "@/lib/utils/observability";
import React from "react";

// Structural validation up front so the route
// stops storing whatever-the-client-sent. Particularly important for
// `vehicle.year`: previously Number(body.vehicle.year) on non-numeric
// input produced NaN, which Mongo accepted and the email later rendered
// as the literal string "NaN".
const currentYear = new Date().getFullYear();
const quoteSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().min(1).max(254),
    phone: z.string().min(1).max(20),
  }),
  serviceType: z.string().min(1).max(100),
  serviceDetails: z.string().max(500).optional().default(""),
  vehicle: z.object({
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.coerce.number().int().min(1900).max(currentYear + 1),
    registration: z.string().max(20).optional(),
  }),
  // (#17) Optional — server-side verifier no-ops without a secret.
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = ipAddress(request) || "unknown";
    const rateLimit = await checkRateLimit(`quote:${ip}`, 3, 60000);

    if (!rateLimit.allowed) {
      return tooManyRequests("Too many requests. Please try again later.");
    }

    // Quote requests require a signed-in customer account.
    const customer = await getCustomerIdentity();
    if (!customer) {
      return unauthorized(
        "Please sign in to your account to request a quote."
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }

    const parsed = quoteSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid request body"
      );
    }
    const body = parsed.data;

    // Tie the quote request to the signed-in account — the email on
    // record is always the account email, so it shows in the customer's
    // dashboard (matched by account email).
    body.customerInfo.email = customer.email;

    // (#17) CAPTCHA check
    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return badRequest("CAPTCHA verification failed. Please try again.");
    }

    // Email/phone get a stricter pass than Zod's basic string check.
    const emailValidation = validateEmail(body.customerInfo.email);
    if (!emailValidation.valid) {
      return badRequest("Invalid email address");
    }
    const phoneValidation = validatePhone(body.customerInfo.phone);
    if (!phoneValidation.valid) {
      return badRequest("Invalid phone number");
    }

    const quoteReference = generateQuoteReference();
    const quotesCollection = await getQuotesCollection();

    const newQuote: Omit<Quote, "_id"> = {
      quoteReference,
      customerInfo: {
        name: sanitizeName(body.customerInfo.name),
        email: emailValidation.sanitized,
        phone: phoneValidation.sanitized,
      },
      // Length & shape are enforced by the Zod schema; React escapes on
      // render so no manual sanitisation needed. (#4)
      serviceType: body.serviceType,
      serviceDetails: body.serviceDetails || "",
      vehicle: {
        make: body.vehicle.make,
        model: body.vehicle.model,
        year: body.vehicle.year,
        registration: body.vehicle.registration?.toUpperCase(),
      },
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await quotesCollection.insertOne(newQuote as Quote);

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
            to: newQuote.customerInfo.email,
            subject: `Quote Request ${quoteReference} - ${shopInfo.businessName}`,
            react: React.createElement(QuoteConfirmation, {
              quote: newQuote as Quote,
              shopInfo: emailShopInfo,
            }),
          });

          if (!emailResult.success) {
            logError(emailResult.error, {
              route: "POST /api/bookings/quote",
              action: "email_send_failed",
              quoteReference,
            });
          }
        } catch (emailError) {
          logError(emailError, {
            route: "POST /api/bookings/quote",
            action: "email_throw",
            quoteReference,
          });
        }
      })()
    );

    return ok({
      quoteReference,
      message:
        "Quote request submitted successfully. We'll get back to you shortly.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/bookings/quote" });
    return serverError();
  }
}
