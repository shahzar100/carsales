import { NextResponse } from "next/server";
import { getBussinessInfoCollection } from "@/lib/models";

export async function GET() {
  try {
    const shopCollection = await getBussinessInfoCollection();
    const shopInfo = await shopCollection.findOne({});

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
