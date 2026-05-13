import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import {
  getPartExchangesCollection,
  serializeDocument,
} from "@/lib/models";
import type { PartExchange } from "@/lib/interfaces";
import PartExchangeTable from "@/components/Admin/PartExchangeTable";

const PAGE_SIZE = 50;
const VALID_STATUSES = ["pending", "valued", "accepted", "declined"];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

/**
 * Day 10 / Fix 10.3 — admin Part-Exchange page.
 *
 * Server-side list; status transitions go through PATCH
 * /api/admin/part-exchange on the client side.
 */
export default async function PartExchangeAdminPage({
  searchParams,
}: PageProps) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const params = await searchParams;
  const filter: Record<string, unknown> = {};
  if (params.status && VALID_STATUSES.includes(params.status)) {
    filter.status = params.status;
  }

  const collection = await getPartExchangesCollection();
  const [rows, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  const enquiries = rows.map((r) => serializeDocument(r) as PartExchange);

  return (
    <PartExchangeTable
      rows={enquiries}
      filter={{ status: params.status }}
      pagination={{ page: 1, limit: PAGE_SIZE, total }}
    />
  );
}
