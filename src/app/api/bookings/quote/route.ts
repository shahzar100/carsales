import { NextRequest, NextResponse } from "next/server";
import { getQuotesCollection, getShopInfoCollection, Quote } from "@/lib/models";
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
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(`quote:${ip}`, 3, 60000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate and sanitize customer info
    if (!body.customerInfo?.name || !body.customerInfo?.email || !body.customerInfo?.phone) {
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

    // Get shop info for email
    const shopCollection = await getShopInfoCollection();
    let shopInfo = await shopCollection.findOne({});

    if (!shopInfo) {
      shopInfo = {
        _id: "default",
        businessName: process.env.NEXT_BUSINESS_NAME || "Car Sales & Service",
        address: process.env.NEXT_BUSINESS_ADDRESS || "123 Auto Street",
        city: process.env.NEXT_BUSINESS_CITY || "City",
        state: process.env.NEXT_BUSINESS_STATE || "State",
        zipCode: process.env.NEXT_BUSINESS_ZIP || "12345",
        phone: process.env.NEXT_BUSINESS_PHONE || "(555) 123-4567",
        email: process.env.NEXT_BUSINESS_EMAIL || "info@carsales.com",
        hours: {
          monday: "9:00 AM - 6:00 PM",
          tuesday: "9:00 AM - 6:00 PM",
          wednesday: "9:00 AM - 6:00 PM",
          thursday: "9:00 AM - 6:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "9:00 AM - 4:00 PM",
          sunday: "Closed",
        },
        updatedAt: new Date(),
      };
    }

    // Send confirmation email
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
      console.warn("⚠️ Email failed to send but quote was created:", emailResult.error);
    }

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
