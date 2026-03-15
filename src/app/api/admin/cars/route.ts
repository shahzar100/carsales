import { NextRequest, NextResponse } from "next/server";
import {
  getCarsCollection,
  CarInterface,
  serializeDocument,
} from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status") || "all";

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = (validPage - 1) * validLimit;

    const carsCollection = await getCarsCollection();

    // Build query filter
    const filter: any = {};
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      success: true,
      data: serializeDocument({
        _id: result.insertedId.toString(),
        ...newCar,
      }),
    });
  } catch (error) {
    console.error("Error creating car:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Car ID is required" },
        { status: 400 }
      );
    }

    const carsCollection = await getCarsCollection();

    const updatedCar = {
      ...updateData,
      year: parseInt(updateData.year),
      price: parseFloat(updateData.price),
      mileage: parseInt(updateData.mileage),
      doors: parseInt(updateData.doors),
      updatedAt: new Date(),
    };

    const result = await carsCollection.updateOne(
      {
        _id: ObjectId.createFromHexString(String(_id)),
      } as unknown as Parameters<typeof carsCollection.updateOne>[0],
      { $set: updatedCar }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: serializeDocument({ _id, ...updatedCar }),
    });
  } catch (error) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Car ID is required" },
        { status: 400 }
      );
    }

    const carsCollection = await getCarsCollection();
    const result = await carsCollection.deleteOne({
      _id: ObjectId.createFromHexString(String(id)),
    } as unknown as Parameters<typeof carsCollection.deleteOne>[0]);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
