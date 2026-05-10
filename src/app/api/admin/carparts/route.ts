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
      {
        _id: ObjectId.createFromHexString(String(_id)),
      } as unknown as Parameters<typeof carPartsCollection.updateOne>[0],
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
    const result = await carPartsCollection.deleteOne({
      _id: ObjectId.createFromHexString(String(id)),
    } as unknown as Parameters<typeof carPartsCollection.deleteOne>[0]);

    if (result.deletedCount === 0) {
      return notFound("Car part not found");
    }

    return NextResponse.json({
      success: true,
      message: "Car part deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car part:", error);
    return serverError();
  }
}
