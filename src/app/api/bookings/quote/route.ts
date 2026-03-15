import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { ipAddress } from "@vercel/functions";
import { getQuotesCollection, Quote } from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { generateQuoteReference } from "@/lib/utils/booking";
import {
  validateEmail,
  validatePhone,
  sanitizeName,
  sanitizeString,
  checkRateLimit,
} from "@/lib/utils/validation";
import { sendEmail } from "@/emails/send";
import { QuoteConfirmation } from "@/emails/QuoteConfirmation";
import React from "react";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = ipAddress(request) || "unknown";
    const rateLimit = checkRateLimit(`quote:${ip}`, 3, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate and sanitize customer info
    if (
      !body.customerInfo?.name ||
      !body.customerInfo?.email ||
      !body.customerInfo?.phone
    ) {
      return NextResponse.json(
        { error: "Customer information is required" },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(body.customerInfo.email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const phoneValidation = validatePhone(body.customerInfo.phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    if (!body.serviceType) {
      return NextResponse.json(
        { error: "Service type is required" },
        { status: 400 }
      );
    }

    if (!body.vehicle?.make || !body.vehicle?.model || !body.vehicle?.year) {
      return NextResponse.json(
        { error: "Vehicle information is required" },
        { status: 400 }
      );
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
      serviceType: sanitizeString(body.serviceType, 100),
      serviceDetails: sanitizeString(body.serviceDetails || "", 500),
      vehicle: {
        make: sanitizeString(body.vehicle.make, 50),
        model: sanitizeString(body.vehicle.model, 50),
        year: Number(body.vehicle.year),
        registration: body.vehicle.registration
          ? sanitizeString(body.vehicle.registration, 20).toUpperCase()
          : undefined,
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
            console.warn(
              "⚠️ Email failed to send but quote was created:",
              emailResult.error
            );
          }
        } catch (emailError) {
          console.error("Error sending quote confirmation email:", emailError);
        }
      })()
    );

    return NextResponse.json({
      success: true,
      data: {
        quoteReference,
        message:
          "Quote request submitted successfully. We'll get back to you shortly.",
      },
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
