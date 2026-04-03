import { NextRequest, NextResponse } from "next/server";
import {
  getCarPartsCollection,
  CarPartInterface,
  serializeDocument,
} from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const carPartsCollection = await getCarPartsCollection();
    const parts = await carPartsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: parts.map((part) => serializeDocument(part)),
    });
  } catch (error) {
    console.error("Error fetching car parts:", error);
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

    // Validate required fields
    if (!body.name || !body.brand || !body.category || body.price == null) {
      return NextResponse.json(
        { error: "Name, brand, category, and price are required" },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: serializeDocument({
        _id: result.insertedId.toString(),
        ...newPart,
      }),
    });
  } catch (error) {
    console.error("Error creating car part:", error);
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
        { error: "Car part ID is required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Car part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeDocument({ _id, ...updatedPart }),
    });
  } catch (error) {
    console.error("Error updating car part:", error);
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
        { error: "Car part ID is required" },
        { status: 400 }
      );
    }

    const carPartsCollection = await getCarPartsCollection();
    const result = await carPartsCollection.deleteOne({
      _id: ObjectId.createFromHexString(String(id)),
    } as unknown as Parameters<typeof carPartsCollection.deleteOne>[0]);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Car part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Car part deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car part:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
