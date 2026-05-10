import { NextRequest } from "next/server";
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
      return tooManyRequests("Too many requests. Please try again later.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON in request body");
    }

    // Validate and sanitize customer info
    if (
      !body.customerInfo?.name ||
      !body.customerInfo?.email ||
      !body.customerInfo?.phone
    ) {
      return badRequest("Customer information is required");
    }

    const emailValidation = validateEmail(body.customerInfo.email);
    if (!emailValidation.valid) {
      return badRequest("Invalid email address");
    }

    const phoneValidation = validatePhone(body.customerInfo.phone);
    if (!phoneValidation.valid) {
      return badRequest("Invalid phone number");
    }

    // Validate service details
    if (!body.serviceType || !body.appointmentDate || !body.appointmentTime) {
      return badRequest("Service details are required");
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

    return ok({
      bookingReference,
      message:
        "Service booking created successfully. Check your email for confirmation.",
    });
  } catch (error) {
    console.error("Error creating service booking:", error);
    return serverError();
  }
}
