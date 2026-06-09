import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { getQuotesCollection, serializeDocument } from "@/lib/models";
import type { Quote } from "@/lib/interfaces";
import QuotesTable from "@/components/Admin/QuotesTable";

const PAGE_SIZE = 50;
const VALID_STATUSES = ["pending", "responded", "accepted", "expired"];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

/**
 * Day 10 / Fix 10.3 — admin Quotes page.
 *
 * Server-side list; status transitions go through PATCH
 * /api/admin/quotes on the client side.
 */
export default async function QuotesAdminPage({ searchParams }: PageProps) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const params = await searchParams;
  const filter: Record<string, unknown> = {};
  if (params.status && VALID_STATUSES.includes(params.status)) {
    filter.status = params.status;
  }

  const parsedPage = Number(params.page);
  const page =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;

  const collection = await getQuotesCollection();
  const [rows, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  const quotes = rows.map((r) => serializeDocument(r) as Quote);

  return (
    <QuotesTable
      rows={quotes}
      filter={{ status: params.status }}
      pagination={{ page, limit: PAGE_SIZE, total }}
    />
  );
}
