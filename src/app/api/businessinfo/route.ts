import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { ok, serverError } from "@/lib/utils/apiResponse";

export async function GET() {
  try {
    const businessInfo = await getBusinessInfo();
    return ok(businessInfo, 200, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching business info:", error);
    return serverError();
  }
}
