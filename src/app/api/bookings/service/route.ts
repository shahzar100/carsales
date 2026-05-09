import { NextRequest, NextResponse } from "next/server";
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
    const ip = ipAddress(request) || "unknown";
    const rateLimit = checkRateLimit(`service-booking:${ip}`, 5, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

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
            console.warn(
              "⚠️ Email failed to send but booking was created:",
              emailResult.error
            );
          }
        } catch (emailError) {
          console.error("Error sending service booking email:", emailError);
        }
      })()
    );

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
