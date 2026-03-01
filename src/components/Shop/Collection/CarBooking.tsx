"use client";

import React from "react";
import { Calendar, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useViewing } from "@/backend/ViewingContext";

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
  const { updateViewingBooking } = useViewing();

  const handleBookingClick = () => {
    updateViewingBooking({
      carId: car._id,
      carDetails: {
        make: car.Brand,
        model: car.Name,
        year: car.Year,
        price: car.Price,
        image: car.Image,
        fuel: car.Fuel,
        doors: car.Doors,
        colour: car.Colour,
        mileage: car.Mileage,
      },
    });
  };
  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 2xl:right-6 2xl:bottom-6 2xl:left-auto 2xl:max-w-sm">
      {/* Main CTA Card */}
      <div className="relative overflow-hidden rounded-t-3xl border-t-4 border-red-500/20 bg-linear-to-br from-gray-900 via-gray-950 to-black shadow-2xl 2xl:rounded-3xl 2xl:border-4">
        <div className="relative p-3 text-white 2xl:p-6">
          {/* Header - Desktop Only */}
          <div className="mb-3 hidden text-center 2xl:block">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-white/20">
              <Calendar size={28} className="text-white" />
            </div>
            <h3 className="mb-1 text-2xl font-bold">Book Your Viewing</h3>
            <p className="text-sm text-gray-400">
              Experience luxury automotive excellence
            </p>
          </div>

          {/* Mobile: 3 Buttons in a Row */}
          <div className="flex w-full gap-2 sm:gap-4 2xl:hidden">
            <Link
              href={`/Booking/${car._id}`}
              onClick={handleBookingClick}
              className="flex w-full transform flex-col items-center justify-center rounded-lg bg-white px-2 py-3 text-xs font-medium text-red-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl"
            >
              <Calendar size={16} className="mb-1" />
              <span>Book</span>
            </Link>
            <a
              href="tel:01234567890"
              className="flex w-full flex-col items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 py-3 text-white transition-all duration-300 hover:border-white/30 hover:bg-white/20 hover:text-red-300"
            >
              <Phone size={16} className="mb-1" />
              <span className="text-xs font-medium">Call</span>
            </a>
            <a
              href="https://maps.google.com/maps?q=Premium+Car+Centre,+123+Motor+Way,+City+Centre"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full flex-col items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 py-3 text-white transition-all duration-300 hover:border-white/30 hover:bg-white/20 hover:text-red-300"
            >
              <MapPin size={16} className="mb-1" />
              <span className="text-xs font-medium">Visit</span>
            </a>
          </div>

          {/* Desktop Layout */}
          <div className="hidden 2xl:block">
            {/* Quick Action Buttons */}
            <div className="mb-3 space-y-2">
              <Link
                href={`/Booking?carId=${car._id}`}
                onClick={handleBookingClick}
                className="group flex w-full transform items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-base font-bold text-red-700 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-gray-50 hover:shadow-2xl"
              >
                <Calendar size={18} />
                Schedule Viewing
                <span className="ml-1 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mb-3 text-center">
              <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                  No Obligation
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
                  Expert Guidance
                </span>
              </div>
            </div>

            {/* Contact Options - Bottom */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:01234567890"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white transition-all duration-300 hover:border-white/30 hover:bg-white/20 hover:text-red-300"
              >
                <Phone size={16} />
                <span className="text-sm font-medium">Call Now</span>
              </a>
              <a
                href="https://maps.google.com/maps?q=Premium+Car+Centre,+123+Motor+Way,+City+Centre"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white transition-all duration-300 hover:border-white/30 hover:bg-white/20 hover:text-red-300"
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
