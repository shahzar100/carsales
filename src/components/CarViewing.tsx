"use client";
import React, { useEffect, useState } from "react";
import { useViewing } from "@/backend/ViewingContext";
import Image from "next/image";
import { Car, Fuel, Palette, Hash, Gauge } from "lucide-react";
import PrimaryButton from "./Helpful/Buttons/PrimaryButton";
import BookingForm from "./Booking/BookingForm";

const CarViewing = () => {
  const { viewingBooking, addBooking, clearViewingBooking } = useViewing();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmission = async () => {
    if (
      !viewingBooking.carDetails ||
      !viewingBooking.selectedDate ||
      !viewingBooking.customerInfo
    ) {
      alert("Please fill in all required information");
      return;
    }

    try {
      // Add to local bookings
      addBooking(viewingBooking);

      // Optional: Send to API
      await fetch("/api/CreateViewingBooking", {
        method: "POST",
        body: JSON.stringify({ booking: viewingBooking }),
        headers: {
          "content-type": "application/json",
        },
      });

      alert("Viewing booked successfully!");
    } catch (error) {
      console.error("Error booking viewing:", error);
      alert("Error booking viewing. Please try again.");
    }
  };

  if (!isClient || !viewingBooking.carDetails) {
    return <div className="text-center p-8">Loading booking details...</div>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto p-6">
      <h2 className="font-bold text-3xl col-span-full text-center mb-6">
        Book Your Car Viewing
      </h2>

      {/* Car Details Section */}
      <div className=" bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-bold text-xl mb-4 flex items-center">
          <Car className="mr-2" size={24} />
          Vehicle Details
        </h3>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <Image
              src={viewingBooking.carDetails.image || "/tesla.webp"}
              width={300}
              height={200}
              alt={`${viewingBooking.carDetails.make} ${viewingBooking.carDetails.model}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>

          <div className="md:w-2/3 space-y-4">
            <h2 className="font-bold text-2xl text-gray-800">
              {viewingBooking.carDetails.year} {viewingBooking.carDetails.make}{" "}
              {viewingBooking.carDetails.model}
            </h2>

            <div className="text-3xl font-bold text-green-600">
              £{viewingBooking.carDetails.price.toLocaleString()}
            </div>

            {/* Compact Vehicle Specifications Grid */}
            {viewingBooking.carDetails.model && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <Gauge className="text-blue-500" size={16} />
                  <div>
                    <p className="text-xs text-gray-600">Mileage</p>
                    <p className="font-medium text-sm">
                      {viewingBooking.carDetails.mileage?.toLocaleString()}{" "}
                      miles
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <Fuel className="text-green-500" size={16} />
                  <div>
                    <p className="text-xs text-gray-600">Fuel Type</p>
                    <p className="font-medium text-sm">
                      {viewingBooking.carDetails.fuel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <Hash className="text-purple-500" size={16} />
                  <div>
                    <p className="text-xs text-gray-600">Doors</p>
                    <p className="font-medium text-sm">
                      {viewingBooking.carDetails.doors}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <Palette className="text-orange-500" size={16} />
                  <div>
                    <p className="text-xs text-gray-600">Colour</p>
                    <p className="font-medium text-sm">
                      {viewingBooking.carDetails.colour}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BookingForm />
    </div>
  );
};

export default CarViewing;
