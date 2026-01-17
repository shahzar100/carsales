import { NextResponse } from "next/server";
import { getBussinessInfoCollection, serializeDocument } from "@/lib/models";

export async function GET() {
  try {
    const shopCollection = await getBussinessInfoCollection();
    const shopInfo = await shopCollection.findOne({});

    return NextResponse.json({
      success: true,
      data: shopInfo ? serializeDocument(shopInfo) : null,
    });
  } catch (error) {
    console.error("Error fetching shop info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
