import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CarViewing from "@/components/CarViewing";
import { getCarById } from "@/lib/models";

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

const BookingPage = async ({ params }: PageProps) => {
  const { _id } = await params;
  // Fetch server-side (rather than from the in-memory `ViewingContext` the
  // "Book a viewing" CTA seeds client-side) so the page survives a hard
  // refresh, a shared link, a bookmark or a new tab. An invalid `_id`
  // resolves to null and the page renders a 404.
  const car = await getCarById(_id, "Booking/[_id]");

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
