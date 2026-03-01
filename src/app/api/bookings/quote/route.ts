import { NextRequest, NextResponse } from "next/server";
import { getQuotesCollection, Quote } from "@/lib/models";
import { generateQuoteReference } from "@/lib/utils/booking";

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

    if (!body.serviceType) {
      return NextResponse.json(
        { error: "Service type is required" },
        { status: 400 }
      );
    }

    if (
      !body.vehicle?.make ||
      !body.vehicle?.model ||
      !body.vehicle?.year
    ) {
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
        name: body.customerInfo.name,
        email: body.customerInfo.email,
        phone: body.customerInfo.phone,
      },
      serviceType: body.serviceType,
      serviceDetails: body.serviceDetails || "",
      vehicle: {
        make: body.vehicle.make,
        model: body.vehicle.model,
        year: Number(body.vehicle.year),
        registration: body.vehicle.registration || undefined,
      },
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await quotesCollection.insertOne(newQuote as Quote);

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
