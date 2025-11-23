import React from "react";
import Link from "next/link";
import { Car, Calendar, Search, Star, Eye, Clock } from "lucide-react";
import clientPromise from "@/backend/mongodb";
import FeaturedCarBookingButton from "./UI/FeaturedCarBookingButton";
import Image from "next/image";

interface FeaturedCar {
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
  Featured?: boolean;
}

const getFeaturedCar = async (): Promise<FeaturedCar | null> => {
  try {
    const client = await clientPromise;
    const db = client.db("carWebsite");
    const collection = db.collection("cars");

    // First try to find a car marked as featured
    let featuredCar = await collection.findOne({ Featured: true });

    // If no featured car found, get the first car from the collection
    if (!featuredCar) {
      featuredCar = await collection.findOne({});
    }

    if (!featuredCar) {
      return null;
    }

    // Convert MongoDB document to plain object
    return {
      _id: featuredCar._id.toString(),
      Name: String(featuredCar.Name || ""),
      Brand: String(featuredCar.Brand || ""),
      Year: Number(featuredCar.Year || new Date().getFullYear()),
      Fuel: String(featuredCar.Fuel || ""),
      Doors: Number(featuredCar.Doors || 4),
      Colour: String(featuredCar.Colour || ""),
      Price: Number(featuredCar.Price || 0),
      Mileage: Number(featuredCar.Mileage || 0),
      Image: featuredCar.Image ? String(featuredCar.Image) : undefined,
      Featured: Boolean(featuredCar.Featured || false),
    };
  } catch (error) {
    console.error("Error fetching featured car:", error);
    return null;
  }
};

const HeroSection = async () => {
  const featuredCar = await getFeaturedCar();
  return (
    <section className="relative z-50 overflow-hidden bg-black text-white">
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Main Heading */}
            <h1 className="mb-8 text-5xl leading-tight font-bold tracking-tight md:text-6xl lg:text-7xl">
              Find Your Perfect Car
              <span className="mt-2 block text-blue-400">
                Book a Viewing Today
              </span>
            </h1>
            {/* Subtitle */}
            <p className="max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">
              Browse our premium collection of vehicles and schedule convenient
              viewing appointments. Experience quality cars with expert
              guidance.
            </p>
          </div>

          {/* Right Column - Featured Car */}
          <div className="relative">
            {featuredCar && (
              <div className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
                {/* Featured Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                  <Star size={16} />
                  Featured Car
                </div>
                {/* Car Image */}
                <div className="group relative">
                  <div className="relative aspect-video w-full rounded-lg">
                    {/* Main Image */}
                    <Image
                      src="/tesla.webp"
                      alt={`${featuredCar.Brand} ${featuredCar.Name}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  </div>

                  {/* Image Loading Fallback */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-800 opacity-0 transition-opacity">
                    <Car size={48} className="text-gray-600" />
                  </div>
                </div>{" "}
                {/* Car Details */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-xl font-bold text-white sm:text-2xl">
                    {featuredCar
                      ? `${featuredCar.Year} ${featuredCar.Brand} ${featuredCar.Name}`
                      : "2023 BMW X5"}
                  </h3>
                  <p className="text-gray-400">
                    {featuredCar &&
                      `${featuredCar.Doors} Door • ${featuredCar.Fuel} • ${featuredCar.Colour}`}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-400 sm:text-3xl">
                      £{featuredCar && featuredCar.Price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400 sm:text-base">
                      {featuredCar &&
                        `${featuredCar.Mileage.toLocaleString()} miles`}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Eye size={16} className="text-blue-400" />
                      <span>Available for viewing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock size={16} className="text-green-400" />
                      <span>Book today</span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4 lg:gap-8 xl:flex-row">
                    {/* View Car Button */}
                    <Link
                      href={
                        featuredCar
                          ? `/BrowseFleet/${featuredCar._id}`
                          : "/BrowseFleet"
                      }
                      className="flex w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-center font-semibold text-white transition-colors hover:border-gray-600 hover:bg-gray-700"
                    >
                      View Details
                    </Link>
                    <FeaturedCarBookingButton car={featuredCar} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button - After Featured Car */}
        <div className="mt-12 flex w-full justify-center">
          <Link
            href="/BrowseFleet"
            className="flex w-full transform items-center justify-center gap-3 rounded-lg bg-blue-600 px-10 py-5 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
          >
            <Search size={24} />
            Browse Cars
          </Link>
        </div>

        {/* Stats Section - Moved Below */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Car className="text-blue-400" size={32} />
                <span className="text-3xl font-bold">500+</span>
              </div>
              <p className="text-gray-300">Quality Vehicles</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Calendar className="text-green-400" size={32} />
                <span className="text-3xl font-bold">24/7</span>
              </div>
              <p className="text-gray-300">Online Booking</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Star className="text-yellow-400" size={32} />
                <span className="text-3xl font-bold">4.9</span>
              </div>
              <p className="text-gray-300">Customer Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
    </section>
  );
};

export default HeroSection;
