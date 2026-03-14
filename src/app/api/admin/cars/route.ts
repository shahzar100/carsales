import { NextRequest, NextResponse } from "next/server";
import {
  getCarsCollection,
  CarInterface,
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
    const carsCollection = await getCarsCollection();

    const newCar: Omit<CarInterface, "_id"> = {
      make: body.make,
      model: body.model,
      year: parseInt(body.year),
      price: parseFloat(body.price),
      mileage: parseInt(body.mileage),
      fuel: body.fuel,
      transmission: body.transmission,
      doors: parseInt(body.doors),
      colour: body.colour,
      image: body.image || "",
      images: body.images || [],
      description: body.description || "",
      features: body.features || [],
      status: body.status || "available",
      createdAt: new Date(),
      updatedAt: new Date(),
      featured: body.featured || false,
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
      { _id: ObjectId.createFromHexString(String(_id)) },
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
    });

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
