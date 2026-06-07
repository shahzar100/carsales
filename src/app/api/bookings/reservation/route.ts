import { notFound } from "@/lib/utils/apiResponse";

/**
 * Reserve-a-car is temporarily disabled.
 *
 * The reservation flow (UI + this endpoint) has been switched off for now;
 * customers are routed to the Book-a-viewing flow instead. We return 404 so
 * the route is effectively unreachable rather than 405/disabled-but-present.
 *
 * The original implementation is preserved in git history — restore it (and
 * re-render <ReserveCarForm/> in CarDetailView) to bring reservations back.
 */
export async function POST() {
  return notFound("Not found");
}
