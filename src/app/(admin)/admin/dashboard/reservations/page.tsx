import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import {
  getReservationsCollection,
  serializeDocument,
} from "@/lib/models";
import type { Reservation } from "@/lib/interfaces";
import ReservationsTable from "@/components/Admin/ReservationsTable";

const PAGE_SIZE = 50;
const VALID_STATUSES = ["pending", "confirmed", "cancelled", "expired"];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

/**
 * Day 10 / Fix 10.3 — admin Reservations page.
 *
 * Read-only here; status transitions go through PATCH
 * /api/admin/reservations on the client side.
 */
export default async function ReservationsAdminPage({
  searchParams,
}: PageProps) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const params = await searchParams;
  const filter: Record<string, unknown> = {};
  if (params.status && VALID_STATUSES.includes(params.status)) {
    filter.status = params.status;
  }

  const parsedPage = Number(params.page);
  const page =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;

  const collection = await getReservationsCollection();
  const [rows, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  const reservations = rows.map(
    (r) => serializeDocument(r) as Reservation
  );

  return (
    <ReservationsTable
      rows={reservations}
      filter={{ status: params.status }}
      pagination={{ page, limit: PAGE_SIZE, total }}
    />
  );
}
