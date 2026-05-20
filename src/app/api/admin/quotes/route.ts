import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getQuotesCollection, serializeDocument } from "@/lib/models";
import { getSession, isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";
import type { Quote } from "@/lib/interfaces";

const VALID_STATUSES = ["pending", "responded", "accepted", "expired"] as const;

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(VALID_STATUSES),
  // Optional admin reply captured in audit metadata. Not persisted to
  // the quote document itself yet — a `responseMessage` schema field
  // can land in a follow-up.
  responseMessage: z.string().max(2000).optional(),
});

/**
 * Day 10 / Fix 10.3 — admin Quotes API.
 *
 * GET returns the quote queue; PATCH transitions a row through
 * pending → responded → accepted/expired. Customer-facing
 * /api/bookings/quote creates rows; admin never creates here.
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

    const collection = await getQuotesCollection();
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
        quotes: rows.map((r) => serializeDocument(r) as Quote),
      },
      pagination: { page, limit, total },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/quotes" });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) return unauthorized();

    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request body");
    }
    const { id, status, responseMessage } = parsed.data;

    if (!ObjectId.isValid(id)) return badRequest("Invalid quote id");

    const collection = await getQuotesCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return notFound("Quote not found");

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: `quote.${status}`,
      targetType: "quote",
      targetId: id,
      metadata: responseMessage ? { responseMessage } : undefined,
    });

    return NextResponse.json({
      success: true,
      data: { quote: serializeDocument(result) as Quote },
    });
  } catch (error) {
    logError(error, { route: "PATCH /api/admin/quotes" });
    return serverError();
  }
}
