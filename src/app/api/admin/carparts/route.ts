import { NextRequest, NextResponse } from "next/server";
import {
  getCarPartsCollection,
  CarPartInterface,
  serializeDocument,
} from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { ObjectId } from "mongodb";
import {
  ok,
  badRequest,
  unauthorized,
  notFound,
  serverError,
} from "@/lib/utils/apiResponse";
import { deleteS3Objects } from "@/lib/utils/s3";
import { logError } from "@/lib/utils/observability";

export async function GET(request: NextRequest) {
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
    console.error("Error fetching car parts:", error);
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

    return ok(
      serializeDocument({
        _id: result.insertedId.toString(),
        ...newPart,
      })
    );
  } catch (error) {
    console.error("Error creating car part:", error);
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
      return badRequest("Invalid or missing car part ID");
    }

    const carPartsCollection = await getCarPartsCollection();

    const updatedPart = {
      ...updateData,
      updatedAt: new Date(),
    };

    const result = await carPartsCollection.updateOne(
      { _id: ObjectId.createFromHexString(String(_id)) },
      { $set: updatedPart }
    );

    if (result.matchedCount === 0) {
      return notFound("Car part not found");
    }

    return ok(serializeDocument({ _id, ...updatedPart }));
  } catch (error) {
    console.error("Error updating car part:", error);
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

    return NextResponse.json({
      success: true,
      message: "Car part deleted successfully",
    });
  } catch (error) {
    logError(error, { route: "DELETE /api/admin/carparts" });
    return serverError();
  }
}
