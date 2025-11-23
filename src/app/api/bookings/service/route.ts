import { NextRequest, NextResponse } from "next/server";
import {
  getServiceAppointmentsCollection,
  ServiceAppointment,
  getShopInfoCollection,
} from "@/lib/models";
import { generateBookingReference } from "@/lib/utils/booking";
import { sendEmail } from "@/lib/email/client";
import { createServiceBookingConfirmationEmail } from "@/lib/email/templates";

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

    if (!body.serviceType || !body.appointmentDate || !body.appointmentTime) {
      return NextResponse.json(
        { error: "Service details are required" },
        { status: 400 }
      );
    }

    const bookingReference = generateBookingReference();
    const serviceCollection = await getServiceAppointmentsCollection();

    const newBooking: Omit<ServiceAppointment, "_id"> = {
      bookingReference,
      customerInfo: {
        name: body.customerInfo.name,
        email: body.customerInfo.email,
        phone: body.customerInfo.phone,
      },
      serviceType: body.serviceType,
      serviceDetails: body.serviceDetails || "",
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
    const emailHtml = createServiceBookingConfirmationEmail(
      newBooking as ServiceAppointment,
      {
        businessName: shopInfo.businessName,
        phone: shopInfo.phone,
        email: shopInfo.email,
        address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
      }
    );

    await sendEmail({
      to: body.customerInfo.email,
      subject: `Service Booking Confirmation - ${bookingReference}`,
      html: emailHtml,
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
