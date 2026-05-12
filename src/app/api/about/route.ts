import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { getCarsCollection } from "@/lib/models";
import { ok, serverError } from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";

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

    return ok(
      {
        businessInfo,
        carStats: {
          total: totalCars,
          available: availableCars,
          sold: soldCars,
          makes: makes.length,
          makesList: makes.sort(),
        },
      },
      200,
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    logError(error, { route: "GET /api/about" });
    return serverError();
  }
}
