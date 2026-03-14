import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  ServiceAppointment,
  getShopInfoCollection,
} from "@/lib/models";
import { generateBookingReference } from "@/lib/utils/booking";
import {
  validateEmail,
  validatePhone,
  sanitizeName,
  sanitizeString,
  validateFutureDate,
  validateAppointmentTime,
  checkRateLimit,
} from "@/lib/utils/validation";
import { sendEmail } from "@/emails/send";
import { ServiceBookingConfirmation } from "@/emails/ServiceBookingConfirmation";
import React from "react";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - max 5 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(`service-booking:${ip}`, 5, 60000);
    
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

    // Validate service details
    if (!body.serviceType || !body.appointmentDate || !body.appointmentTime) {
      return NextResponse.json(
        { error: "Service details are required" },
        { status: 400 }
      );
    }

    if (!validateFutureDate(body.appointmentDate)) {
      return NextResponse.json(
        { error: "Appointment date must be in the future and within one year" },
        { status: 400 }
      );
    }

    if (!validateAppointmentTime(body.appointmentTime)) {
      return NextResponse.json(
        { error: "Invalid appointment time" },
        { status: 400 }
      );
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
      serviceType: sanitizeString(body.serviceType, 100),
      serviceDetails: sanitizeString(body.serviceDetails || "", 500),
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await serviceCollection.insertOne(newBooking as ServiceAppointment);

    // Get shop info for email
    const shopCollection = await getShopInfoCollection();
    const dbShopInfo = await shopCollection.findOne({});

    const shopInfo = dbShopInfo || {
      businessName: process.env.NEXT_BUSINESS_NAME || "Car Sales & Viewing",
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
        saturday: "10:00 AM - 4:00 PM",
        sunday: "Closed",
      },
      updatedAt: new Date(),
    };

    // Send confirmation email
    const emailShopInfo = {
      businessName: shopInfo.businessName,
      phone: shopInfo.phone,
      email: shopInfo.email,
      address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
    };

    await sendEmail({
      to: body.customerInfo.email,
      subject: `Service Booking Confirmation - ${bookingReference}`,
      react: React.createElement(ServiceBookingConfirmation, {
        booking: newBooking as ServiceAppointment,
        shopInfo: emailShopInfo,
      }),
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingReference,
        message:
          "Service booking created successfully. Check your email for confirmation.",
      },
    });
  } catch (error) {
    console.error("Error creating service booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
