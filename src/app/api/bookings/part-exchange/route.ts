import { notFound } from "@/lib/utils/apiResponse";

/**
 * Part-exchange enquiries are temporarily disabled.
 *
 * The part-exchange flow (UI + this endpoint) has been switched off for now.
 * We return 404 so the route is effectively unreachable rather than
 * 405/disabled-but-present.
 *
 * The original implementation is preserved in git history — restore it (and
 * re-render <PartExchangeForm/> in CarDetailView) to bring it back. The admin
 * side (/api/admin/part-exchange) is untouched so existing enquiries can still
 * be managed.
 */
export async function POST() {
  return notFound("Not found");
}
