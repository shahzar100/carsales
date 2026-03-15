import { NextRequest, NextResponse } from "next/server";
import { getBussinessInfoCollection, serializeDocument } from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import type { ShopInfo } from "@/lib/interfaces";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessInfo = await getBusinessInfo();

    return NextResponse.json({
      success: true,
      data: businessInfo,
    });
  } catch (error) {
    console.error("Error fetching shop info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const shopCollection = await getBussinessInfoCollection();

    const shopInfo: Omit<ShopInfo, "_id"> = {
      businessName: body.businessName,
      address: body.address,
      city: body.city,
      state: body.state || "",
      zipCode: body.zipCode || "",
      phone: body.phone,
      email: body.email,
      bookingsEmail: body.bookingsEmail || "",
      googleMapsUrl: body.googleMapsUrl || "",
      hours: body.hours,
      description: body.description || "",
      socialMedia: body.socialMedia || {},
      heroStats: body.heroStats,
      detailingPackages: body.detailingPackages,
      tintOptions: body.tintOptions,
      serviceOverviews: body.serviceOverviews,
      recovery: body.recovery,
      updatedAt: new Date(),
    };

    const result = await shopCollection.updateOne(
      {},
      { $set: shopInfo },
      { upsert: true }
    );

    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        data: serializeDocument(shopInfo),
      });
    } else {
      return NextResponse.json(
        { error: "Failed to update shop information" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating shop info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
