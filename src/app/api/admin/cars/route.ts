import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import {
  getCarsCollection,
  CarInterface,
  serializeDocument,
} from "@/lib/models";
import { getSession, isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";
import { recordAudit } from "@/lib/utils/audit";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { logError } from "@/lib/utils/observability";
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
import { invalidateFeaturedCarCache } from "@/lib/utils/featuredCarCache";

// Shared write limiter across POST / PUT / DELETE on the cars
// collection. A compromised manager session shouldn't be usable to
// rewrite the entire fleet (and trigger fleet-wide revalidations + S3
// deletes) in one burst. 60/min is well above legitimate dashboard use.
const carsWriteLimiter = createRateLimiter("admin-cars-write", {
  maxRequests: 60,
  windowMs: 60 * 1000,
});

/**
 * (#27) Invalidate the customer-facing fleet pages after any car mutation
 * so admin changes show up without waiting for the 60s revalidate timer.
 * Also drops the distributed featured-car cache (Day 11.2). Called from
 * POST / PUT / DELETE below.
 */
async function revalidateFleetPaths(carId?: string) {
  revalidatePath("/BrowseFleet");
  revalidatePath("/"); // featured car on home
  if (carId) revalidatePath(`/BrowseFleet/${carId}`);
  await invalidateFeaturedCarCache();
}

// ── Car validation schema ────────────────────────────────────
const carSchema = z.object({
  make: z.string().min(1, "Make is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 2, "Year too far in the future"),
  price: z.coerce.number().positive("Price must be positive"),
  mileage: z.coerce.number().int().min(0, "Mileage cannot be negative"),
  fuel: z.enum(["Petrol", "Diesel", "Electric", "Hybrid"]),
  transmission: z.enum(["Manual", "Automatic", "CVT"]),
  doors: z.coerce.number().int().min(1).max(10),
  colour: z.string().min(1, "Colour is required").max(50),
  image: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(""),
  features: z.array(z.string()).optional().default([]),
  status: z
    .enum(["available", "sold", "reserved"])
    .optional()
    .default("available"),
  featured: z.boolean().optional().default(false),
});

const VALID_STATUSES = ["available", "sold", "reserved"] as const;

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status") || "all";

    if (status !== "all" && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return badRequest("Invalid status value");
    }

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = (validPage - 1) * validLimit;

    const carsCollection = await getCarsCollection();

    // Build query filter. `status` is narrowed at the route boundary
    // (one of "available" | "sold" | "reserved" | "all") via the
    // searchParams.get above; CarInterface.status is the enum, so we
    // type the local filter as Partial<CarInterface> to keep it aligned.
    const filter: Partial<Pick<CarInterface, "status">> = {};
    if (status !== "all") {
      filter.status = status as CarInterface["status"];
    }

    // Get total count for pagination
    const total = await carsCollection.countDocuments(filter);

    // Get paginated cars
    const cars = await carsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .toArray();

    // GET admin cars: response shape preserves the legacy `pagination` field
    // at the top level (alongside `data`) for compatibility with existing
    // admin dashboard fetchers that read `response.pagination`.
    return NextResponse.json({
      success: true,
      data: cars.map((car) => serializeDocument(car)),
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        pages: Math.ceil(total / validLimit),
      },
    });
  } catch (error) {
    logError(error, { route: "GET /api/admin/cars" });
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }

    if (!(await hasMinimumRole("manager"))) {
      return forbidden("Manager role required");
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await carsWriteLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const body = await request.json();
    const parsed = carSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const carsCollection = await getCarsCollection();

    const newCar: Omit<CarInterface, "_id"> = {
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await carsCollection.insertOne(newCar as CarInterface);

    await revalidateFleetPaths(result.insertedId.toString());

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "car.create",
      targetType: "car",
      targetId: result.insertedId.toString(),
      metadata: {
        make: newCar.make,
        model: newCar.model,
        year: newCar.year,
      },
    });

    return ok(
      serializeDocument({
        _id: result.insertedId.toString(),
        ...newCar,
      })
    );
  } catch (error) {
    logError(error, { route: "POST /api/admin/cars" });
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
    const { allowed, resetIn } = await carsWriteLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id || !ObjectId.isValid(String(_id))) {
      return badRequest("Invalid or missing car ID");
    }

    // Validate update data with partial car schema
    const parsed = carSchema.partial().safeParse(updateData);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const carsCollection = await getCarsCollection();

    const updatedCar = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    const result = await carsCollection.updateOne(
      { _id: ObjectId.createFromHexString(String(_id)) },
      { $set: updatedCar }
    );

    if (result.matchedCount === 0) {
      return notFound("Car not found");
    }

    await revalidateFleetPaths(String(_id));

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "car.update",
      targetType: "car",
      targetId: String(_id),
      metadata: { fields: Object.keys(parsed.data) },
    });

    return ok(serializeDocument({ _id, ...updatedCar }));
  } catch (error) {
    logError(error, { route: "PUT /api/admin/cars" });
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
    const { allowed, resetIn } = await carsWriteLimiter.check(ip);
    if (!allowed) {
      return tooManyRequests("Too many requests. Please try again later.", {
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(String(id))) {
      return badRequest("Invalid or missing car ID");
    }

    const carsCollection = await getCarsCollection();
    const _id = ObjectId.createFromHexString(String(id));

    // Read the document first so we can clean up its S3 images after the
    // Mongo delete succeeds. (CODEBASE_ISSUES C8.)
    const carDoc = await carsCollection.findOne({ _id });

    const result = await carsCollection.deleteOne({ _id });

    if (result.deletedCount === 0) {
      return notFound("Car not found");
    }

    // Best-effort S3 cleanup. Failures here are logged but don't fail the
    // request — orphaned S3 objects are recoverable, a user-visible delete
    // failure isn't.
    if (carDoc) {
      const keys: Array<string | undefined> = [
        carDoc.image,
        ...((carDoc.images as string[] | undefined) ?? []),
      ];
      const cleanup = await deleteS3Objects(keys);
      if (cleanup.failed.length > 0) {
        logError(
          new Error(`S3 cleanup partial failure on car delete (${cleanup.failed.length} keys)`),
          {
            route: "DELETE /api/admin/cars",
            carId: String(_id),
            failed: cleanup.failed.map((f) => f.key),
          }
        );
      }
    }

    await revalidateFleetPaths(String(_id));

    const session = await getSession();
    await recordAudit({
      actor: session.username ?? "unknown",
      action: "car.delete",
      targetType: "car",
      targetId: String(_id),
      metadata: carDoc
        ? { make: carDoc.make, model: carDoc.model, year: carDoc.year }
        : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    logError(error, { route: "DELETE /api/admin/cars" });
    return serverError();
  }
}
