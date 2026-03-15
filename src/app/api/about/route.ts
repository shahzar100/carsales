import { NextResponse } from "next/server";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { getCarsCollection } from "@/lib/models";

export async function GET() {
  try {
    const [businessInfo, carsCollection] = await Promise.all([
      getBusinessInfo(),
      getCarsCollection(),
    ]);

    // Get car stats from MongoDB
    const [totalCars, availableCars, soldCars, makes] = await Promise.all([
      carsCollection.countDocuments({}),
      carsCollection.countDocuments({ status: "available" }),
      carsCollection.countDocuments({ status: "sold" }),
      carsCollection.distinct("make", { status: "available" }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        businessInfo,
        carStats: {
          total: totalCars,
          available: availableCars,
          sold: soldCars,
          makes: makes.length,
          makesList: makes.sort(),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching about info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
