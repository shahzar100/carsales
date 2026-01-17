import { NextRequest, NextResponse } from "next/server";
import {
  getCarsCollection,
  CarInterface,
  serializeDocument,
} from "@/lib/models";
import { isAuthenticated } from "@/lib/utils/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const carsCollection = await getCarsCollection();
    const cars = await carsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: cars.map((car) => serializeDocument(car)),
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
      { _id: new ObjectId(String(_id)) as any },
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
      _id: new ObjectId(String(id)) as any,
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
