import { NextRequest, NextResponse } from "next/server";
import {
  getCarViewingBookingsCollection,
  CarViewingBooking,
  getShopInfoCollection,
} from "@/lib/models";
import { generateBookingReference } from "@/lib/utils/booking";
import { sendEmail } from "@/emails/send";
import { CarViewingConfirmation } from "@/emails/CarViewingConfirmation";
import React from "react";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
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
        name: body.customerInfo.name,
        email: body.customerInfo.email,
        phone: body.customerInfo.phone,
      },
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      dealership: body.dealership || undefined,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await viewingCollection.insertOne(newBooking as CarViewingBooking);

    // Get shop info for email
    const shopCollection = await getShopInfoCollection();
    let shopInfo = await shopCollection.findOne({});

    if (!shopInfo) {
      shopInfo = {
        businessName: process.env.NEXT_BUSINESS_NAME || "Car Sales & Viewing",
        address: process.env.NEXT_BUSINESS_ADDRESS || "123 Auto Street",
        city: process.env.NEXT_BUSINESS_CITY || "City",
        state: process.env.NEXT_BUSINESS_STATE || "State",
        zipCode: process.env.NEXT_BUSINESS_ZIP || "12345",
        phone: process.env.NEXT_BUSINESS_PHONE || "(555) 123-4567",
        email: process.env.NEXT_BUSINESS_EMAIL || "info@carsales.com",
        hours: {},
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

    console.log("📧 Attempting to send confirmation email...");
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
      // Don't fail the request if email fails - booking is still valid
    } else {
      console.log("✅ Confirmation email sent successfully");
    }

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
