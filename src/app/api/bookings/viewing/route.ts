import { NextRequest, NextResponse } from "next/server";
import { getCarViewingBookingsCollection, CarViewingBooking, getShopInfoCollection } from "@/lib/models";
import { generateBookingReference } from "@/lib/utils/booking";
import { sendEmail } from "@/lib/email/client";
import { createCarViewingBookingConfirmationEmail } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customerInfo?.name || !body.customerInfo?.email || !body.customerInfo?.phone) {
      return NextResponse.json(
        { error: "Customer information is required" },
        { status: 400 }
      );
    }

    if (!body.carId || !body.carDetails || !body.appointmentDate || !body.appointmentTime) {
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
        businessName: "Car Sales & Viewing",
        address: "123 Auto Street, City, State 12345",
        phone: "(555) 123-4567",
        email: "info@carsales.com",
      } as any;
    }

    // Send confirmation email
    const emailHtml = createCarViewingBookingConfirmationEmail(newBooking as CarViewingBooking, {
      businessName: shopInfo.businessName,
      phone: shopInfo.phone,
      email: shopInfo.email,
      address: `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}`,
    });

    await sendEmail({
      to: body.customerInfo.email,
      subject: `Car Viewing Confirmation - ${bookingReference}`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingReference,
        message: "Car viewing booking created successfully. Check your email for confirmation.",
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
