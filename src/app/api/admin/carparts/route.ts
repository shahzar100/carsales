import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { z } from "zod";
import {
  getCarPartsCollection,
  CarPartInterface,
  serializeDocument,
} from "@/lib/models";
import { getSession, isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";
import { ObjectId } from "mongodb";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { deleteS3Objects } from "@/lib/utils/s3";
import { logError } from "@/lib/utils/observability";
import { recordAudit } from "@/lib/utils/audit";

// Defensive cap shared across POST / PUT / DELETE on car parts. A
// compromised manager session shouldn't be usable to churn the
// inventory collection or fire S3 deletes en masse. 60/min is well
// above legitimate dashboard use.
const carPartsWriteLimiter = createRateLimiter("admin-carparts-write", {
  maxRequests: 60,
  windowMs: 60 * 1000,
});

// ── Car-part update schema ───────────────────────────────────
// PUT spreads the validated object straight into a Mongo `$set`. A
// `.strict()` schema is the gate that stops mass-assignment: it rejects
// ANY key not listed here — including `$`-prefixed operator keys
// (`$set`, `$where`, …) and dotted paths. Every field is optional so a
// PUT can patch any subset.
const carPartUpdateSchema = z
  .object({
    name: z.string().min(1).max(200),
    brand: z.string().min(1).max(100),
    category: z.string().min(1).max(100),
    price: z.coerce.number().nonnegative().max(10_000_000),
    image: z.string().max(2000),
    condition: z.enum(["New", "Used", "Refurbished"]),
    compatibility: z.string().max(500),
    description: z.string().max(5000),
    inStock: z.boolean(),
  })
  .partial()
  .strict();

export async function GET(_request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }

    const carPartsCollection = await getCarPartsCollection();
    const parts = await carPartsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return ok(parts.map((part) => serializeDocument(part)));
  } catch (error) {
    logError(error, { route: "GET /api/admin/carparts" });
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }
    // Writes are manager-or-above. A read-only `staff` session can list
    // car parts (GET) but cannot create, update or delete them.
    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await carPartsWriteLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.brand || !body.category || body.price == null) {
      return badRequest("Name, brand, category, and price are required");
    }

    if (body.category && /[${}]/.test(String(body.category))) {
      return badRequest("Invalid category value");
    }

    const carPartsCollection = await getCarPartsCollection();

    const newPart: Omit<CarPartInterface, "_id"> = {
      name: body.name,
      brand: body.brand,
      category: body.category,
      price: body.price,
      image: body.image || "",
      condition: body.condition || "New",
      compatibility: body.compatibility || "",
      description: body.description || "",
      inStock: body.inStock ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await carPartsCollection.insertOne(
      newPart as CarPartInterface
    );

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "carPart.create",
      targetType: "carPart",
      targetId: result.insertedId.toString(),
      metadata: { name: newPart.name, brand: newPart.brand },
    });

    return ok(
      serializeDocument({
        _id: result.insertedId.toString(),
        ...newPart,
      })
    );
  } catch (error) {
    logError(error, { route: "POST /api/admin/carparts" });
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }
    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await carPartsWriteLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id || !ObjectId.isValid(String(_id))) {
      return badRequest("Invalid or missing car part ID");
    }

    // Reject Mongo-operator / prototype-pollution keys outright (clear
    // message), then strict-parse so only known car-part fields survive
    // into the `$set` below.
    if (
      Object.keys(updateData).some(
        (k) => k.startsWith("$") || k.includes(".") || k === "__proto__"
      )
    ) {
      return badRequest("Update contains invalid field names");
    }

    const parsed = carPartUpdateSchema.safeParse(updateData);
    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ?? "Invalid car part data"
      );
    }

    const carPartsCollection = await getCarPartsCollection();

    const updatedPart = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    const result = await carPartsCollection.updateOne(
      { _id: ObjectId.createFromHexString(String(_id)) },
      { $set: updatedPart }
    );

    if (result.matchedCount === 0) {
      return notFound("Car part not found");
    }

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "carPart.update",
      targetType: "carPart",
      targetId: String(_id),
      metadata: { fields: Object.keys(parsed.data) },
    });

    return ok(serializeDocument({ _id, ...updatedPart }));
  } catch (error) {
    logError(error, { route: "PUT /api/admin/carparts" });
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }
    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await carPartsWriteLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(String(id))) {
      return badRequest("Invalid or missing car part ID");
    }

    const carPartsCollection = await getCarPartsCollection();
    const _id = ObjectId.createFromHexString(String(id));

    // Read the document so we can clean up its S3 image after the Mongo
    // delete succeeds. (CODEBASE_ISSUES C8.)
    const partDoc = await carPartsCollection.findOne({ _id });

    const result = await carPartsCollection.deleteOne({ _id });

    if (result.deletedCount === 0) {
      return notFound("Car part not found");
    }

    if (partDoc) {
      const cleanup = await deleteS3Objects([
        (partDoc as { image?: string }).image,
      ]);
      if (cleanup.failed.length > 0) {
        logError(
          new Error(`S3 cleanup partial failure on carpart delete (${cleanup.failed.length} keys)`),
          {
            route: "DELETE /api/admin/carparts",
            partId: String(_id),
            failed: cleanup.failed.map((f) => f.key),
          }
        );
      }
    }

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "carPart.delete",
      targetType: "carPart",
      targetId: String(_id),
      metadata: partDoc
        ? { name: (partDoc as { name?: string }).name }
        : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Car part deleted successfully",
    });
  } catch (error) {
    logError(error, { route: "DELETE /api/admin/carparts" });
    return serverError();
  }
}
