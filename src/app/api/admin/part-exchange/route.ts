import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  getPartExchangesCollection,
  serializeDocument,
} from "@/lib/models";
import { getSession, isAuthenticated } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import {
  badRequest,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";
import type { PartExchange } from "@/lib/interfaces";

const VALID_STATUSES = ["pending", "valued", "accepted", "declined"] as const;

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(VALID_STATUSES),
  // Valuation amount in pounds — captured for audit when moving a row
  // to "valued". Not persisted to the part-exchange document yet; a
  // schema field for it will land in a follow-up.
  valuation: z.number().int().nonnegative().max(10_000_000).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Day 10 / Fix 10.3 — admin Part-Exchange API.
 *
 * GET returns the enquiry queue; PATCH transitions a row through
 * pending → valued → accepted/declined. The customer-facing
 * /api/bookings/part-exchange endpoint creates rows; admin never
 * creates here.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) return unauthorized();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
      200
    );

    const filter: Record<string, unknown> = {};
    if (statusParam && VALID_STATUSES.includes(statusParam as never)) {
      filter.status = statusParam;
    }

    const collection = await getPartExchangesCollection();
    const [rows, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        partExchanges: rows.map((r) => serializeDocument(r) as PartExchange),
      },
      pagination: { page, limit, total },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/part-exchange" });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) return unauthorized();

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request body");
    }
    const { id, status, valuation, notes } = parsed.data;

    if (!ObjectId.isValid(id)) return badRequest("Invalid part-exchange id");

    const collection = await getPartExchangesCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return notFound("Part-exchange enquiry not found");

    const session = await getSession();
    const metadata: Record<string, unknown> = {};
    if (valuation !== undefined) metadata.valuation = valuation;
    if (notes) metadata.notes = notes;

    await recordAudit({
      actor: session.username ?? "unknown",
      action: `partExchange.${status}`,
      targetType: "partExchange",
      targetId: id,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    });

    return NextResponse.json({
      success: true,
      data: { partExchange: serializeDocument(result) as PartExchange },
    });
  } catch (error) {
    logError(error, { route: "PATCH /api/admin/part-exchange" });
    return serverError();
  }
}
