"use client";
import React, { useEffect, useState } from "react";
import { useViewing } from "@/backend/ViewingContext";
import Image from "next/image";
import { Calendar, Clock, MapPin, Car, Phone, Mail, User } from "lucide-react";
import PrimaryButton from "./Helpful/Buttons/PrimaryButton";

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl mx-auto p-6">
      <h2 className="font-bold text-3xl col-span-full text-center mb-6">
        Book Your Car Viewing
      </h2>

      {/* Car Details Section */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-bold text-xl mb-4 flex items-center">
          <Car className="mr-2" size={24} />
          Vehicle Details
        </h3>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <Image
              src={viewingBooking.carDetails.image || "/car.webp"}
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
          </div>
        </div>
      </div>

      {/* Booking Information Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <h3 className="font-bold text-xl mb-4">Viewing Details</h3>

        {viewingBooking.selectedDate && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <Calendar className="text-blue-500" size={20} />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{viewingBooking.selectedDate}</p>
            </div>
          </div>
        )}

        {viewingBooking.selectedTime && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <Clock className="text-blue-500" size={20} />
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-medium">{viewingBooking.selectedTime}</p>
            </div>
          </div>
        )}

        {viewingBooking.dealership && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <MapPin className="text-blue-500" size={20} />
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">
                {viewingBooking.dealership.location}
              </p>
              <p className="text-sm text-gray-500">
                {viewingBooking.dealership.address}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Information Section */}
      {viewingBooking.customerInfo && (
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-bold text-xl mb-4">Contact Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <User className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {viewingBooking.customerInfo.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <Mail className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">
                  {viewingBooking.customerInfo.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <Phone className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">
                  {viewingBooking.customerInfo.phone}
                </p>
              </div>
            </div>

            {viewingBooking.customerInfo.message && (
              <div className="md:col-span-2 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Message</p>
                <p className="text-sm">{viewingBooking.customerInfo.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="lg:col-span-full flex gap-4 justify-center mt-6">
        <button
          onClick={clearViewingBooking}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <PrimaryButton
          onClick={handleSubmission}
          text="Confirm Viewing Booking"
        />
      </div>
    </div>
  );
};

export default CarViewing;
