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
    <section className="relative bg-black text-white overflow-hidden z-60">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
              Find Your Perfect Car
              <span className="block text-blue-400 mt-2">
                Book a Viewing Today
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl leading-relaxed">
              Browse our premium collection of vehicles and schedule convenient
              viewing appointments. Experience quality cars with expert
              guidance.
            </p>
          </div>

          {/* Right Column - Featured Car */}
          <div className="relative">
            {featuredCar ? (
              <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-800 shadow-2xl flex flex-col gap-4 sm:gap-6 lg:gap-8">
                {/* Featured Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  <Star size={16} />
                  Featured Car
                </div>
                {/* Car Image */}
                <div className="group relative">
                  <div className="aspect-video w-full relative rounded-lg">
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
                  <div className="absolute inset-0 bg-gray-800 rounded-xl flex items-center justify-center opacity-0 transition-opacity">
                    <Car size={48} className="text-gray-600" />
                  </div>
                </div>{" "}
                {/* Car Details */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {featuredCar
                      ? `${featuredCar.Year} ${featuredCar.Brand} ${featuredCar.Name}`
                      : "2023 BMW X5"}
                  </h3>
                  <p className="text-gray-400">
                    {featuredCar &&
                      `${featuredCar.Doors} Door • ${featuredCar.Fuel} • ${featuredCar.Colour}`}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-bold text-green-400">
                      £{featuredCar && featuredCar.Price.toLocaleString()}
                    </span>
                    <span className="text-sm sm:text-base text-gray-400">
                      {featuredCar &&
                        `${featuredCar.Mileage.toLocaleString()} miles`}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Eye size={16} className="text-blue-400" />
                      <span>Available for viewing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock size={16} className="text-green-400" />
                      <span>Book today</span>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4 lg:gap-8 flex-col sm:flex-row xl:flex-row w-full">
                    {/* View Car Button */}
                    <Link
                      href={
                        featuredCar
                          ? `/BrowseFleet/${featuredCar._id}`
                          : "/BrowseFleet"
                      }
                      className="flex items-center justify-center w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors text-center border border-gray-700 hover:border-gray-600"
                    >
                      View Details
                    </Link>
                    <FeaturedCarBookingButton car={featuredCar} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl text-center">
                <div className="bg-gray-800 rounded-xl h-48 mb-6 flex items-center justify-center border border-gray-700">
                  <Car size={64} className="text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No Featured Cars Available
                </h3>
                <p className="text-gray-400 mb-6">
                  Please check back later or browse our full collection.
                </p>
                <Link
                  href="/BrowseFleet"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Search size={20} />
                  Browse All Cars
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button - After Featured Car */}
        <div className="flex justify-center mt-12 w-full">
          <Link
            href="/BrowseFleet"
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-lg font-semibold transition-all duration-300 gap-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full"
          >
            <Search size={24} />
            Browse Cars
          </Link>
        </div>

        {/* Stats Section - Moved Below */}
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
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
