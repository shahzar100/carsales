import { NextRequest } from "next/server";
import {
  getCarPartsCollection,
  CarPartInterface,
  serializeDocument,
} from "@/lib/models";
import { ok, serverError } from "@/lib/utils/apiResponse";
import { logError } from "@/lib/utils/observability";

// ── Seed data (from CarParts page mock data) ─────────────────
const seedCarParts: Omit<CarPartInterface, "_id">[] = [
  {
    name: "BMW M3 Brake Pads",
    brand: "BMW",
    category: "Brakes",
    price: 149.99,
    image: "/car.jpg",
    condition: "New",
    compatibility: "BMW M3 2019-2023",
    description:
      "High-performance ceramic brake pads for superior stopping power.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Honda Civic Headlight Assembly",
    brand: "Honda",
    category: "Lighting",
    price: 245.0,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Honda Civic 2016-2021",
    description: "OEM replacement headlight with LED technology.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Toyota Camry Air Filter",
    brand: "Toyota",
    category: "Engine",
    price: 24.99,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Toyota Camry 2018-2024",
    description: "High-efficiency air filter for optimal engine performance.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Audi A4 Side Mirror",
    brand: "Audi",
    category: "Body",
    price: 189.5,
    image: "/car.jpg",
    condition: "Used",
    compatibility: "Audi A4 2017-2022",
    description: "Driver side mirror with integrated turn signal.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Ford F-150 Tailgate Handle",
    brand: "Ford",
    category: "Body",
    price: 89.99,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Ford F-150 2015-2020",
    description: "Durable replacement tailgate handle with chrome finish.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Mercedes C-Class Radiator",
    brand: "Mercedes",
    category: "Cooling",
    price: 320.0,
    image: "/car.jpg",
    condition: "Refurbished",
    compatibility: "Mercedes C-Class 2014-2019",
    description: "Aluminum radiator with enhanced cooling capacity.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Nissan Altima Exhaust Pipe",
    brand: "Nissan",
    category: "Exhaust",
    price: 156.75,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Nissan Altima 2019-2023",
    description: "Stainless steel exhaust pipe for improved performance.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Volkswagen Golf Wheel Hub",
    brand: "Volkswagen",
    category: "Wheels",
    price: 67.5,
    image: "/car.jpg",
    condition: "Refurbished",
    compatibility: "VW Golf 2016-2022",
    description: "Front wheel hub assembly with bearing included.",
    inStock: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const carPartsCollection = await getCarPartsCollection();

    // Seed if the collection is empty
    const count = await carPartsCollection.countDocuments();
    if (count === 0) {
      await carPartsCollection.insertMany(seedCarParts as CarPartInterface[]);
    }

    // Build filter from optional query params
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand");
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");

    const filter: Record<string, string> = {};
    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (condition) filter.condition = condition;

    const parts = await carPartsCollection.find(filter).toArray();

    return ok(parts.map((part) => serializeDocument(part)));
  } catch (error) {
    logError(error, { route: "GET /api/carparts" });
    return serverError();
  }
}
