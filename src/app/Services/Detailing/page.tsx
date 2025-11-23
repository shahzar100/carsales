"use client";
import React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle, Clock, Shield, ArrowLeft } from "lucide-react";

const Detailing = () => {
  const [selectedPackage, setSelectedPackage] = React.useState("silver");

  const detailingPackages = [
    {
      id: "bronze",
      name: "Detailing Bronze",
      subtitle: "Mini Valet",
      price: "£150",
      duration: "2-3 hours",
      description: "Essential cleaning for your vehicle inside and out",
      exteriorFeatures: [
        "Citrus pre wash treatment",
        "Snow foam",
        "Contact wash",
        "Towel and blow dry",
        "Alloy wheels, tyres and arches deep cleaned",
        "Tyre dressing",
      ],
      interiorFeatures: [
        "Seats, mats and carpets vacuumed",
        "High pressure blowout",
        "All interior plastics and surfaces hot wiped",
        "Steering wheel clean program",
        "Windows cleaned inside and out",
      ],
      popular: false,
      includesPrevious: null,
    },
    {
      id: "silver",
      name: "Detailing Silver",
      subtitle: "Mini Outside, Full Inside",
      price: "£280",
      duration: "4-5 hours",
      description:
        "Enhanced exterior protection with comprehensive interior deep clean",
      exteriorFeatures: [
        "All services from Bronze",
        "3 month high gloss ceramic protection",
      ],
      interiorFeatures: [
        "All services from Bronze",
        "All interior plastics and surfaces deep cleaned",
        "Leather conditioner / fabric shampoo",
        "All surfaces, plastics steam cleaned",
      ],
      popular: true,
      includesPrevious: "Bronze",
    },
    {
      id: "gold",
      name: "Detailing Gold",
      subtitle: "Complete Premium Service",
      price: "£450",
      duration: "6-8 hours",
      description:
        "Ultimate detailing package with full paint decontamination and deep interior extraction",
      exteriorFeatures: [
        "All services from Silver",
        "Paint decontamination",
        "Iron contaminant removal",
        "Tar and glue contaminant removal",
        "Clay bar treatment",
      ],
      interiorFeatures: [
        "All services from Silver",
        "Full extraction clean of seats, mats and carpets",
      ],
      popular: false,
      includesPrevious: "Silver",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/Services"
          className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Services
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
          <Sparkles size={32} />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Professional Car Detailing
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Transform your vehicle with our premium detailing services. Choose
          your package below and book today.
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Eco-Friendly Products
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-blue-500 mr-2" />
            Same Day Service
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-purple-500 mr-2" />
            Satisfaction Guaranteed
          </div>
        </div>
      </div>

      {/* Service Packages */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Choose Your Detailing Package
        </h2>
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {detailingPackages.map((pkg, index) => {
            const isSelected = selectedPackage === pkg.id;
            return (
              <div
                key={index}
                className={`relative bg-white border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
                    : pkg.popular
                    ? "border-blue-400 shadow-lg transform scale-[1.02] bg-linear-to-b from-blue-50 to-white"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                } ${pkg.popular ? "p-5" : "p-6"}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {/* Most Popular Badge - Top of Card */}
                {pkg.popular && (
                  <div className="mb-4">
                    <div className="bg-linear-to-r from-blue-500 to-blue-600 px-4 py-2 rounded-lg text-sm font-bold text-center shadow-md text-black">
                      ⭐ MOST POPULAR ⭐
                    </div>
                  </div>
                )}

                {/* Radio Button */}
                <div className="absolute top-4 right-4">
                  <input
                    type="radio"
                    name="detailing-package"
                    value={pkg.id}
                    checked={isSelected}
                    onChange={() => setSelectedPackage(pkg.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {pkg.name}
                  </h3>
                  <div className="text-sm text-gray-600 mb-2">
                    {pkg.subtitle}
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {pkg.price}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    {pkg.duration}
                  </div>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>

                <div className="space-y-3">
                  {/* Exterior Features */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-900 mb-2 text-xs uppercase tracking-wide">
                      Exterior Services
                    </h4>
                    <div className="space-y-1">
                      {pkg.exteriorFeatures.map((feature, idx) => {
                        const isIncluded =
                          feature.startsWith("All services from");
                        return (
                          <div key={idx} className="flex items-start">
                            <CheckCircle
                              className={`h-3 w-3 mr-2 mt-0.5 flex-shrink-0 ${
                                isIncluded ? "text-blue-500" : "text-green-500"
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isIncluded
                                  ? "font-medium text-blue-700 italic"
                                  : "text-gray-700"
                              }`}
                            >
                              {feature}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interior Features */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 mb-2 text-xs uppercase tracking-wide">
                      Interior Services
                    </h4>
                    <div className="space-y-1">
                      {pkg.interiorFeatures.map((feature, idx) => {
                        const isIncluded =
                          feature.startsWith("All services from");
                        return (
                          <div key={idx} className="flex items-start">
                            <CheckCircle
                              className={`h-3 w-3 mr-2 mt-0.5 flex-shrink-0 ${
                                isIncluded ? "text-blue-500" : "text-green-500"
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isIncluded
                                  ? "font-medium text-blue-700 italic"
                                  : "text-gray-700"
                              }`}
                            >
                              {feature}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Single Book Button */}
        <div className="text-center">
          <a
            href={`mailto:info@carsales.com?subject=Detailing Service Booking - ${
              detailingPackages.find((pkg) => pkg.id === selectedPackage)?.name
            }&body=Hi, I'd like to book the ${
              detailingPackages.find((pkg) => pkg.id === selectedPackage)?.name
            } package for ${
              detailingPackages.find((pkg) => pkg.id === selectedPackage)?.price
            }. Please let me know available dates and times.`}
            className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Book{" "}
            {detailingPackages.find((pkg) => pkg.id === selectedPackage)?.name}{" "}
            -{" "}
            {detailingPackages.find((pkg) => pkg.id === selectedPackage)?.price}
          </a>
          <div className="mt-3">
            <a
              href="tel:(555)123-4567"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Or call (555) 123-4567 for questions
            </a>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Our Detailing Process
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Inspection</h3>
            <p className="text-gray-600 text-sm">
              Thorough assessment of your vehicle&apos;s condition and specific
              needs
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Preparation</h3>
            <p className="text-gray-600 text-sm">
              Pre-wash rinse and setup in our controlled environment
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Detailing</h3>
            <p className="text-gray-600 text-sm">
              Professional cleaning, correction, and protection application
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Final Check</h3>
            <p className="text-gray-600 text-sm">
              Quality inspection and customer walkthrough before delivery
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-500 text-white rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Transform Your Vehicle?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Book your detailing service today and experience the difference
          professional care makes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:info@carsales.com?subject=Detailing Service Booking&body=Hi, I'd like to book a detailing service. Please contact me to discuss package options and scheduling."
            className="bg-white text-blue-500 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Book Now via Email
          </a>
          <a
            href="tel:(555)123-4567"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 border border-blue-400"
          >
            Call (555) 123-4567
          </a>
        </div>
      </div>
    </div>
  );
};

export default Detailing;
