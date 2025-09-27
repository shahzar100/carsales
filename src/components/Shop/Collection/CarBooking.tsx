"use client";

import React, { useState, useEffect } from "react";
import { useViewing } from "@/backend/ViewingContext";
import { Calendar, MapPin, Phone, Clock, ChevronDown } from "lucide-react";
import Link from "next/link";

interface CarData {
  _id: string;
  Name: string;
  Brand: string;
  Year: number;
  Fuel: string;
  Doors: number;
  Colour: string;
  Price: number;
  Mileage: number;
  Image?: string;
}

interface CarBookingProps {
  car: CarData;
}

const CarBooking: React.FC<CarBookingProps> = ({ car }) => {
  return (
    <div className="sticky top-8">
      {/* Main CTA Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 text-white">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={36} className="text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-2">Book Your Viewing</h3>
            <p className="text-blue-100">
              Experience luxury automotive excellence
            </p>
          </div>

          {/* Date and Time Selection */}
          <div className="space-y-6 mb-8">{/* Date Selector */}</div>

          {/* Contact Information */}
          <div className="space-y-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MapPin className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-blue-100 mb-1">
                    Showroom Location
                  </p>
                  <p className="font-semibold text-white">Premium Car Centre</p>
                  <p className="text-xs text-blue-200">
                    123 Motor Way, City Centre, SW1A 1AA
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Phone className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-blue-100 mb-1">
                    Expert Consultation
                  </p>
                  <p className="font-semibold text-white">01234 567890</p>
                  <p className="text-xs text-blue-200">
                    Available Monday - Saturday, 9AM - 8PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/Booking?carId=${car._id}`}
            className={`w-full px-8 py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 bg-white text-blue-700 hover:bg-gray-50
            `}
          >
            Book Viewing
            <Calendar size={24} />
          </Link>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-blue-100">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                No Obligation
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Expert Guidance
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarBooking;
