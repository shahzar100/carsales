import { NextRequest } from "next/server";
import { z } from "zod";
import { ipAddress } from "@vercel/functions";
import {
  ok,
  badRequest,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { getEnquiriesCollection, Enquiry } from "@/lib/models";
import {
  validateEmail,
  validatePhone,
  sanitizeName,
  checkRateLimit,
} from "@/lib/utils/validation";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { logError } from "@/lib/utils/observability";
import { v4 as uuidv4 } from "uuid";

// General sales enquiry — a lighter-weight lead than a Reservation or
// part-exchange, optionally tied to the car the customer was viewing.
const enquirySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().min(1).max(254),
  phone: z.string().min(1).max(20),
  carId: z.string().max(64).optional(),
  carName: z.string().max(200).optional(),
  message: z.string().max(2000).optional().default(""),
  // (#17) Optional so the route still works when Turnstile isn't
  // configured locally; the server-side verifier handles the prod contract.
  turnstileToken: z.string().optional(),
});

function generateEnquiryReference(): string {
  const uuid = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `ENQ-${uuid}`;
}

export async function POST(request: NextRequest) {
  try {
    const ip = ipAddress(request) || "unknown";
    // 3 enquiries per 10 minutes per IP.
    const rateLimit = await checkRateLimit(`enquiry:${ip}`, 3, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return tooManyRequests("Too many enquiries. Please try again later.");
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }

    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid request body"
      );
    }
    const body = parsed.data;

    // (#17) CAPTCHA check before doing any DB work.
    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return badRequest("CAPTCHA verification failed. Please try again.");
    }

    const emailValidation = validateEmail(body.email);
    if (!emailValidation.valid) {
      return badRequest("Invalid email address");
    }

    const phoneValidation = validatePhone(body.phone);
    if (!phoneValidation.valid) {
      return badRequest("Invalid phone number");
    }

    const enquiryReference = generateEnquiryReference();
    const enquiriesCollection = await getEnquiriesCollection();

    const newEnquiry: Omit<Enquiry, "_id"> = {
      enquiryReference,
      customerInfo: {
        name: sanitizeName(body.name),
        email: emailValidation.sanitized,
        phone: phoneValidation.sanitized,
      },
      carId: body.carId,
      carName: body.carName,
      message: body.message,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await enquiriesCollection.insertOne(newEnquiry as Enquiry);

    return ok({
      enquiryReference,
      message:
        "Your enquiry has been submitted. We'll get back to you as soon as possible.",
    });
  } catch (error) {
    logError(error, { route: "POST /api/enquiries" });
    return serverError();
  }
}
