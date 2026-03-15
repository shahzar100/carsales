import { NextResponse } from "next/server";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

export async function GET() {
  try {
    const businessInfo = await getBusinessInfo();

    return NextResponse.json({
      success: true,
      data: businessInfo,
    });
  } catch (error) {
    console.error("Error fetching business info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
