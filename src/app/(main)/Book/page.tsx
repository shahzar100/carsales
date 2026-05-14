import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import BookingFlow from "@/components/Booking/Flow/BookingFlow";
import "./booking-flow.css";

export const metadata: Metadata = {
  title: "Book a Service",
  description:
    "Book detailing, window tinting, or repairs at Morley Motor. Pick your service, package, and a date that suits you — no deposit required.",
  alternates: { canonical: "/Book" },
  openGraph: {
    title: "Book a Service",
    description:
      "Book detailing, window tinting, or repairs. Pick your service, package, and a date that suits you.",
    url: "/Book",
  },
};

export default async function BookPage() {
  const businessInfo = await getBusinessInfo();
  const detailingPackages = businessInfo.detailingPackages ?? [];
  const tintOptions = businessInfo.tintOptions ?? [];

  return (
    <Suspense fallback={null}>
      <BookingFlow
        detailingPackages={detailingPackages}
        tintOptions={tintOptions}
      />
    </Suspense>
  );
}
