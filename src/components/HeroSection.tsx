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
    <section className="relative bg-black text-white overflow-hidden">
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
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
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl leading-relaxed">
              Browse our premium collection of vehicles and schedule convenient
              viewing appointments. Experience quality cars with expert
              guidance.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/BrowseFleet"
                className="flex items-center w-full justify-center bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-lg font-semibold transition-all duration-300 gap-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Search size={24} />
                Browse Cars
              </Link>
            </div>
          </div>

          {/* Right Column - Featured Car */}
          <div className="relative">
            {featuredCar ? (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
                {/* Featured Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <Star size={16} />
                  Featured Car
                </div>

                {/* Car Image */}
                <div className="bg-gray-800 rounded-xl h-56 mb-6 flex items-center justify-center border border-gray-700 overflow-hidden">
                  <Image
                    src={"/tesla.webp"}
                    alt={`${featuredCar.Brand} ${featuredCar.Name}`}
                    width={500}
                    height={500}
                    className="w-full h-96 object-cover"
                  />
                </div>

                {/* Car Details */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    {featuredCar
                      ? `${featuredCar.Year} ${featuredCar.Brand} ${featuredCar.Name}`
                      : "2023 BMW X5"}
                  </h3>
                  <p className="text-gray-400">
                    {featuredCar
                      ? `${featuredCar.Doors} Door • ${featuredCar.Fuel} • ${featuredCar.Colour}`
                      : "Premium SUV • Automatic • Petrol"}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-blue-400">
                      £
                      {featuredCar
                        ? featuredCar.Price.toLocaleString()
                        : "45,999"}
                    </span>
                    <span className="text-gray-400">
                      {featuredCar
                        ? `${featuredCar.Mileage.toLocaleString()} miles`
                        : "15,000 miles"}
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

                  <div className="flex gap-8 flex-col xl:flex-row w-full">
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

        {/* Stats Section - Moved Below */}
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Car className="text-blue-400" size={32} />
                <span className="text-3xl font-bold">500+</span>
              </div>
              <p className="text-gray-300">Quality Vehicles</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-green-400" size={32} />
                <span className="text-3xl font-bold">24/7</span>
              </div>
              <p className="text-gray-300">Online Booking</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
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
