import { NextRequest, NextResponse } from "next/server";
import {
  getCarsCollection,
  CarInterface,
  serializeDocument,
} from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  ok,
  badRequest,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/utils/apiResponse";

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

    const VALID_STATUSES = ["available", "sold", "reserved"] as const;
    if (status !== "all" && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return badRequest("Invalid status value");
    }

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = (validPage - 1) * validLimit;

    const carsCollection = await getCarsCollection();

    // Build query filter
    const filter: { status?: string } = {};
    if (status !== "all") {
      filter.status = status;
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
    console.error("Error fetching cars:", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
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

    return ok(
      serializeDocument({
        _id: result.insertedId.toString(),
        ...newCar,
      })
    );
  } catch (error) {
    console.error("Error creating car:", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
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
      {
        _id: ObjectId.createFromHexString(String(_id)),
      } as unknown as Parameters<typeof carsCollection.updateOne>[0],
      { $set: updatedCar }
    );

    if (result.matchedCount === 0) {
      return notFound("Car not found");
    }

    return ok(serializeDocument({ _id, ...updatedCar }));
  } catch (error) {
    console.error("Error updating car:", error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(String(id))) {
      return badRequest("Invalid or missing car ID");
    }

    const carsCollection = await getCarsCollection();
    const result = await carsCollection.deleteOne({
      _id: ObjectId.createFromHexString(String(id)),
    } as unknown as Parameters<typeof carsCollection.deleteOne>[0]);

    if (result.deletedCount === 0) {
      return notFound("Car not found");
    }

    return NextResponse.json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car:", error);
    return serverError();
  }
}
