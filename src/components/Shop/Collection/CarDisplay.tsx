import React from "react";
import Image from "next/image";
import { useViewing } from "@/backend/ViewingContext";
import {
  Calendar,
  Car,
  Fuel,
  Palette,
  DoorOpen,
  MapPin,
  Phone,
} from "lucide-react";

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

interface CarDisplayProps {
  car: CarData;
}

const CarDisplay: React.FC<CarDisplayProps> = ({ car }) => {
  const { updateViewingBooking } = useViewing();

  const handleBookViewing = () => {
    updateViewingBooking({
      carId: car._id,
      carDetails: {
        make: car.Brand,
        model: car.Name,
        year: car.Year,
        price: car.Price,
        image: car.Image || "/car.webp",
      },
    });
    // Navigate to booking page
    window.location.href = "/Booking";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image Section */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden">
        <Image
          src={car.Image || "/car.webp"}
          fill
          className="object-cover"
          alt={`${car.Brand} ${car.Name}`}
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute bottom-8 left-8 text-white">
          <h1 className="text-4xl lg:text-6xl font-bold mb-2">
            {car.Year} {car.Brand} {car.Name}
          </h1>
          <p className="text-xl lg:text-2xl">£{car.Price.toLocaleString()}</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Car Details */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Vehicle Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Car className="text-blue-500" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Make & Model</p>
                    <p className="font-semibold">
                      {car.Brand} {car.Name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Calendar className="text-blue-500" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-semibold">{car.Year}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Fuel className="text-blue-500" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-semibold">{car.Fuel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <DoorOpen className="text-blue-500" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Doors</p>
                    <p className="font-semibold">{car.Doors}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Palette className="text-blue-500" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-semibold">{car.Colour}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <MapPin className="text-blue-500" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Mileage</p>
                    <p className="font-semibold">
                      {car.Mileage?.toLocaleString() || "N/A"} miles
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                About This Vehicle
              </h3>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-700 leading-relaxed">
                  This {car.Year} {car.Brand} {car.Name} is in excellent
                  condition and ready for viewing. With its{" "}
                  {car.Fuel.toLowerCase()} engine and {car.Colour.toLowerCase()}{" "}
                  exterior, this vehicle offers both performance and style.
                  Contact us today to schedule a viewing and experience this car
                  firsthand.
                </p>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Book a Viewing
                </h3>
                <p className="text-gray-600">
                  Schedule an appointment to see this vehicle
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <MapPin className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">Main Showroom</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <Phone className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">01234 567890</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBookViewing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Book Viewing Now
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                No obligation • Free viewing • Expert advice
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDisplay;
