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
          className="inline-flex items-center font-medium text-red-600 hover:text-red-700"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Services
        </Link>
      </div>

      {/* Hero Section */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Sparkles size={32} />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
          Professional Car Detailing
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-lg text-gray-600">
          Transform your vehicle with our premium detailing services. Choose
          your package below and book today.
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Eco-Friendly Products
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-blue-500" />
            Same Day Service
          </div>
          <div className="flex items-center">
            <Shield className="mr-2 h-4 w-4 text-purple-500" />
            Satisfaction Guaranteed
          </div>
        </div>
      </div>

      {/* Service Packages */}
      <div className="mb-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Choose Your Detailing Package
        </h2>
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {detailingPackages.map((pkg, index) => {
            const isSelected = selectedPackage === pkg.id;
            return (
              <div
                key={index}
                className={`relative cursor-pointer rounded-xl border-2 bg-white transition-all duration-300 ${
                  isSelected
                    ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
                    : pkg.popular
                      ? "scale-[1.02] transform border-blue-400 bg-linear-to-b from-blue-50 to-white shadow-lg"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                } ${pkg.popular ? "p-5" : "p-6"}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {/* Most Popular Badge - Top of Card */}
                {pkg.popular && (
                  <div className="mb-4">
                    <div className="rounded-lg bg-linear-to-r from-blue-500 to-blue-600 px-4 py-2 text-center text-sm font-bold text-black shadow-md">
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
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4 text-center">
                  <h3 className="mb-1 text-xl font-bold text-gray-900">
                    {pkg.name}
                  </h3>
                  <div className="mb-2 text-sm text-gray-600">
                    {pkg.subtitle}
                  </div>
                  <div className="mb-1 text-3xl font-bold text-blue-600">
                    {pkg.price}
                  </div>
                  <div className="mb-3 text-sm text-gray-500">
                    {pkg.duration}
                  </div>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>

                <div className="space-y-3">
                  {/* Exterior Features */}
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-blue-900 uppercase">
                      Exterior Services
                    </h4>
                    <div className="space-y-1">
                      {pkg.exteriorFeatures.map((feature, idx) => {
                        const isIncluded =
                          feature.startsWith("All services from");
                        return (
                          <div key={idx} className="flex items-start">
                            <CheckCircle
                              className={`mt-0.5 mr-2 h-3 w-3 shrink-0 ${
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
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                      Interior Services
                    </h4>
                    <div className="space-y-1">
                      {pkg.interiorFeatures.map((feature, idx) => {
                        const isIncluded =
                          feature.startsWith("All services from");
                        return (
                          <div key={idx} className="flex items-start">
                            <CheckCircle
                              className={`mt-0.5 mr-2 h-3 w-3 shrink-0 ${
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
            className="inline-flex items-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors duration-200 hover:bg-blue-700 hover:shadow-xl"
          >
            Book{" "}
            {detailingPackages.find((pkg) => pkg.id === selectedPackage)?.name}{" "}
            -{" "}
            {detailingPackages.find((pkg) => pkg.id === selectedPackage)?.price}
          </a>
          <div className="mt-3">
            <a
              href="tel:(555)123-4567"
              className="font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600"
            >
              Or call (555) 123-4567 for questions
            </a>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="mb-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Our Detailing Process
        </h2>
        <div className="grid gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              1
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Inspection</h3>
            <p className="text-sm text-gray-600">
              Thorough assessment of your vehicle&apos;s condition and specific
              needs
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              2
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Preparation</h3>
            <p className="text-sm text-gray-600">
              Pre-wash rinse and setup in our controlled environment
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              3
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Detailing</h3>
            <p className="text-sm text-gray-600">
              Professional cleaning, correction, and protection application
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              4
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Final Check</h3>
            <p className="text-sm text-gray-600">
              Quality inspection and customer walkthrough before delivery
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="rounded-2xl bg-blue-500 p-8 text-center text-white lg:p-12">
        <h2 className="mb-4 text-3xl font-bold">
          Ready to Transform Your Vehicle?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
          Book your detailing service today and experience the difference
          professional care makes.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="mailto:info@carsales.com?subject=Detailing Service Booking&body=Hi, I'd like to book a detailing service. Please contact me to discuss package options and scheduling."
            className="rounded-lg bg-white px-8 py-3 font-medium text-blue-500 transition-colors duration-200 hover:bg-gray-100"
          >
            Book Now via Email
          </a>
          <a
            href="tel:(555)123-4567"
            className="rounded-lg border border-blue-400 bg-blue-600 px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
          >
            Call (555) 123-4567
          </a>
        </div>
      </div>
    </div>
  );
};

export default Detailing;
