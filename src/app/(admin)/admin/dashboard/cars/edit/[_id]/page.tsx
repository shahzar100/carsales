import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ObjectId } from "mongodb";

import { CarInterface } from "@/lib/interfaces";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import EditCarForm from "@/components/Admin/Form/EditCarForm";

interface PageProps {
  params: Promise<{ _id: string }>;
}

const getCar = async (id: string): Promise<CarInterface | null> => {
  if (!ObjectId.isValid(id)) return null;
  try {
    const carsCollection = await getCarsCollection();
    const car = await carsCollection.findOne({
      _id: new ObjectId(id) as never,
    });
    if (!car) return null;
    return serializeDocument(car) as CarInterface;
  } catch (error) {
    console.error("Error fetching car for edit:", error);
    return null;
  }
};

const EditCarPage = async ({ params }: PageProps) => {
  const { _id } = await params;
  const car = await getCar(_id);

  if (!car) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Link
          href="/admin/dashboard/cars"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inventory
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Vehicle not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            The car you&apos;re trying to edit doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/admin/dashboard/cars"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inventory
      </Link>

      <div className="mb-6">
        <h1 className="page-title">Edit Vehicle</h1>
        <p className="mt-1 text-sm text-gray-500">
          {car.year} {car.make} {car.model} — quick edit for the most-changed
          fields.
        </p>
      </div>

      <EditCarForm car={car} />
    </div>
  );
};

export default EditCarPage;
