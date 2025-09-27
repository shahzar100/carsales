"use client";

import React from "react";
import { Calendar, MapPin, Phone } from "lucide-react";
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
    <div className="fixed bottom-0 left-0 right-0 2xl:bottom-6 2xl:right-6 2xl:left-auto 2xl:max-w-sm z-50">
      {/* Main CTA Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-t-3xl 2xl:rounded-3xl shadow-2xl overflow-hidden border-t-4 2xl:border-4 border-blue-200/20 relative">
        <div className="relative p-3 2xl:p-6 text-white">
          {/* Header - Desktop Only */}
          <div className="text-center mb-3 hidden 2xl:block">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Calendar size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-1">Book Your Viewing</h3>
            <p className="text-blue-100 text-sm">
              Experience luxury automotive excellence
            </p>
          </div>

          {/* Mobile: 3 Buttons in a Row */}
          <div className="flex w-full gap-8 2xl:hidden">
            <Link
              href={`/Booking?carId=${car._id}`}
              className="flex w-full flex-col items-center justify-center px-2 py-3 rounded-lg font-medium text-xs transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-white text-blue-700 hover:bg-gray-50"
            >
              <Calendar size={16} className="mb-1" />
              <span>Book</span>
            </Link>
            <a
              href="tel:01234567890"
              className="flex w-full flex-col items-center justify-center px-2 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 text-white hover:text-blue-100 border border-white/20 hover:border-white/30"
            >
              <Phone size={16} className="mb-1" />
              <span className="text-xs font-medium">Call</span>
            </a>
            <a
              href="https://maps.google.com/maps?q=Premium+Car+Centre,+123+Motor+Way,+City+Centre"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full flex-col items-center justify-center px-2 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 text-white hover:text-blue-100 border border-white/20 hover:border-white/30"
            >
              <MapPin size={16} className="mb-1" />
              <span className="text-xs font-medium">Visit</span>
            </a>
          </div>

          {/* Desktop Layout */}
          <div className="hidden 2xl:block">
            {/* Quick Action Buttons */}
            <div className="space-y-2 mb-3">
              <Link
                href={`/Booking?carId=${car._id}`}
                className="w-full px-6 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 bg-white text-blue-700 hover:bg-gray-50 group"
              >
                <Calendar size={18} />
                Schedule Viewing
                <span className="ml-1 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-3 text-xs text-blue-100">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  No Obligation
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                  Expert Guidance
                </span>
              </div>
            </div>

            {/* Contact Options - Bottom */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:01234567890"
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-white hover:text-blue-100 border border-white/20 hover:border-white/30"
              >
                <Phone size={16} />
                <span className="text-sm font-medium">Call Now</span>
              </a>
              <a
                href="https://maps.google.com/maps?q=Premium+Car+Centre,+123+Motor+Way,+City+Centre"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-white hover:text-blue-100 border border-white/20 hover:border-white/30"
              >
                <MapPin size={16} />
                <span className="text-sm font-medium">Showroom</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarBooking;
