import { NextResponse } from "next/server";
import { getShopInfoCollection } from "@/lib/models";

export async function GET() {
  try {
    const shopCollection = await getShopInfoCollection();
    const shopInfo = await shopCollection.findOne({});

    if (!shopInfo) {
      // Return default shop info if none exists
      return NextResponse.json({
        success: true,
        data: {
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
          description: "Your trusted car dealership",
          socialMedia: {
            facebook: "",
            twitter: "",
            instagram: "",
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: shopInfo,
    });
  } catch (error) {
    console.error("Error fetching shop info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
