import React from "react";
import type { Metadata } from "next";
import CarViewing from "@/components/CarViewing";

export const metadata: Metadata = {
  title: "Book a Viewing",
  robots: { index: false, follow: false },
};

const BookingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <CarViewing />
    </div>
  );
};

export default BookingPage;
