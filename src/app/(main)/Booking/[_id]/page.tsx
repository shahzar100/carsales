import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import CarViewing from "@/components/CarViewing";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import type { CarInterface } from "@/lib/interfaces";
import { logError } from "@/lib/utils/observability";

// Per-user / per-request; must not cache. (Audit #1.)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Viewing",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{
    _id: string;
  }>;
}

/**
 * Fetch the car for the booking page from its `[_id]` route segment.
 *
 * Fetching server-side (rather than relying on the in-memory
 * `ViewingContext`, which the "Book a viewing" CTA seeds client-side) is
 * what makes the page survive a hard refresh, a shared link, a bookmark
 * or a new tab — previously any of those showed "No Car Selected".
 *
 * An invalid `_id` makes `new ObjectId` throw; the catch returns null and
 * the page renders a 404.
 */
async function getCar(id: string): Promise<CarInterface | null> {
  try {
    const carsCollection = await getCarsCollection();
    const car = await carsCollection.findOne({
      _id: new ObjectId(id) as never,
    });
    if (!car) return null;
    return serializeDocument(car) as CarInterface;
  } catch (error) {
    logError(error, { context: "Booking/[_id].getCar" });
    return null;
  }
}

const BookingPage = async ({ params }: PageProps) => {
  const { _id } = await params;
  const car = await getCar(_id);

  if (!car) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CarViewing initialCar={car} />
    </div>
  );
};

export default BookingPage;
