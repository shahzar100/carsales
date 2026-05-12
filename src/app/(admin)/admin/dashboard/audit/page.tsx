import { redirect } from "next/navigation";
import { isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";
import { getAuditLogsCollection, serializeDocument } from "@/lib/models";
import type { AuditLog } from "@/lib/interfaces";
import AuditLogTable from "@/components/Admin/AuditLogTable";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{
    actor?: string;
    action?: string;
    targetType?: string;
    cursor?: string; // ISO timestamp of the last row on the previous page
  }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin/login");

  // Audit data is admin-only. Manager/staff don't get to read who did what.
  const isAdmin = await hasMinimumRole("admin");
  if (!isAdmin) redirect("/admin/dashboard");

  const params = await searchParams;
  const filter: Record<string, unknown> = {};

  if (params.actor && params.actor.trim()) {
    filter.actor = params.actor.trim();
  }
  if (params.action && params.action.trim()) {
    filter.action = params.action.trim();
  }
  if (
    params.targetType &&
    [
      "car",
      "carPart",
      "user",
      "booking",
      "viewing",
      "reservation",
      "partExchange",
      "quote",
      "shop",
      "other",
    ].includes(params.targetType)
  ) {
    filter.targetType = params.targetType;
  }
  if (params.cursor) {
    const cursorDate = new Date(params.cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      filter.createdAt = { $lt: cursorDate };
    }
  }

  const collection = await getAuditLogsCollection();
  const rows = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE + 1)
    .toArray();

  const hasMore = rows.length > PAGE_SIZE;
  const page = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map(
    (r) => serializeDocument(r) as AuditLog
  );
  const nextCursor = hasMore
    ? (page[page.length - 1].createdAt as unknown as string)
    : null;

  // Distinct values fuel the filter dropdowns. Cap the lookup so the
  // page stays fast even with millions of audit rows — see also the
  // {actor, createdAt} index in getAuditLogsCollection().
  const [distinctActors, distinctActions] = await Promise.all([
    collection.distinct("actor"),
    collection.distinct("action"),
  ]);

  return (
    <AuditLogTable
      rows={page}
      actors={distinctActors.sort()}
      actions={distinctActions.sort()}
      filter={{
        actor: params.actor,
        action: params.action,
        targetType: params.targetType,
      }}
      nextCursor={nextCursor}
    />
  );
}
