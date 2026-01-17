"use client";
import React from "react";
import { Sparkles, CheckCircle, Clock, Shield } from "lucide-react";
import {
  ServiceHero,
  BackNavigation,
} from "@/components/Services/Common";
import { DetailingPackageGrid } from "@/components/Services/Detailing";

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

  const heroProps = {
    icon: Sparkles,
    iconBgColor: "bg-blue-100 text-blue-600",
    title: "Professional Car Detailing",
    description:
      "Transform your vehicle with our premium detailing services. Choose your package below and book today.",
    badges: [
      { icon: CheckCircle, text: "Eco-Friendly Products", color: "text-green-500" },
      { icon: Clock, text: "Same Day Service", color: "text-blue-500" },
      { icon: Shield, text: "Satisfaction Guaranteed", color: "text-purple-500" },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BackNavigation href="/Services" text="Back to Services" />
      
      <ServiceHero {...heroProps} />
      
      <DetailingPackageGrid 
        packages={detailingPackages}
        selectedPackage={selectedPackage}
        onSelectPackage={setSelectedPackage}
      />

      {/* Contact Section */}
      <div className="rounded-2xl bg-blue-500 p-8 text-center text-white lg:p-12">
        <h2 className="mb-4 text-3xl font-bold">Ready to Detail Your Car?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
          Book your professional car detailing service today. Our expert team
          will make your vehicle look like new again.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="mailto:info@carsales.com?subject=Car Detailing Booking&body=Hi, I'd like to book a car detailing service. Please provide available dates and package options."
            className="rounded-lg bg-white px-8 py-3 font-medium text-blue-500 transition-colors duration-200 hover:bg-gray-100"
          >
            Book Now
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