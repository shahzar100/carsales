import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/utils/apiResponse";
import { getReviewsCollection, serializeDocument, Review } from "@/lib/models";
import { logError } from "@/lib/utils/observability";

// Public, read-only list of verified reviews, optionally filtered by
// `serviceType`. Cached at the edge — reviews change rarely.
export async function GET(request: NextRequest) {
  try {
    const reviewsCollection = await getReviewsCollection();
    const filter: Record<string, unknown> = { verified: true };

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get("serviceType");
    if (serviceType) {
      filter.serviceType = serviceType;
    }

    const reviews = await reviewsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return ok(
      reviews.map((review) => serializeDocument(review) as Review),
      200,
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    logError(error, { route: "GET /api/reviews" });
    return serverError();
  }
}
