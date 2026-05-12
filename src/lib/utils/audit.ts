import { getAuditLogsCollection } from "@/lib/models";
import { logError } from "@/lib/utils/observability";
import type { AuditLog } from "@/lib/interfaces";

/**
 * Day 10 / Fix 10.1 — append a row to the auditLogs collection.
 *
 * Every state-changing admin route should call this on success. The
 * implementation swallows write failures (and surfaces them to
 * observability) so logging can never block the parent operation: an
 * audit-log outage is a forensics hit, not a customer-facing outage.
 *
 * Usage:
 *
 *   await recordAudit({
 *     actor: session.username ?? "unknown",
 *     action: "car.update",
 *     targetType: "car",
 *     targetId: carId,
 *     metadata: { fields: ["price", "status"] },
 *   });
 *
 * Reads happen on the admin /audit page (Fix 10.1, follow-up PR).
 */
export async function recordAudit(
  entry: Omit<AuditLog, "_id" | "createdAt">
): Promise<void> {
  try {
    const coll = await getAuditLogsCollection();
    await coll.insertOne({
      ...entry,
      createdAt: new Date(),
    });
  } catch (error) {
    logError(error, {
      context: "audit.recordAudit",
      action: entry.action,
      targetType: entry.targetType,
    });
  }
}
