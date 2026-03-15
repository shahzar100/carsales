import { NextRequest, NextResponse } from "next/server";
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
import { sendEmail } from "@/emails/send";
import { CarViewingConfirmation } from "@/emails/CarViewingConfirmation";
import React from "react";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = ipAddress(request) || "unknown";
    const rateLimit = checkRateLimit(`viewing-booking:${ip}`, 5, 60000);

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

    // Validate booking details
    if (
      !body.carId ||
      !body.carDetails ||
      !body.appointmentDate ||
      !body.appointmentTime
    ) {
      return NextResponse.json(
        { error: "Booking details are required" },
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
    const viewingCollection = await getCarViewingBookingsCollection();

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
      dealership: body.dealership || undefined,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await viewingCollection.insertOne(newBooking as CarViewingBooking);

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
            console.warn(
              "⚠️ Email failed to send but booking was created:",
              emailResult.error
            );
          }
        } catch (emailError) {
          console.error("Error sending car viewing email:", emailError);
        }
      })()
    );

    return NextResponse.json({
      success: true,
      data: {
        bookingReference,
        message:
          "Car viewing booking created successfully. Check your email for confirmation.",
      },
    });
  } catch (error) {
    console.error("Error creating car viewing booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
