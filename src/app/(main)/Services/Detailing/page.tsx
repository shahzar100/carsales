import React from "react";
import { Sparkles, CheckCircle, Clock, Shield } from "lucide-react";
import { ServiceHero, BackNavigation } from "@/components/Services/Common";
import { DetailingPackageGrid } from "@/components/Services/Detailing";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";

const Detailing = () => {
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
      {
        icon: CheckCircle,
        text: "Eco-Friendly Products",
        color: "text-green-500",
      },
      { icon: Clock, text: "Same Day Service", color: "text-blue-500" },
      {
        icon: Shield,
        text: "Satisfaction Guaranteed",
        color: "text-purple-500",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BackNavigation href="/Services" text="Back to Services" />

      <ServiceHero {...heroProps} />

      <DetailingPackageGrid packages={detailingPackages} />

      {/* Book a Detailing Service */}
      <div id="book" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Book Your Detailing Service
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Fill in the form below and we&apos;ll confirm your appointment.
          </p>
        </div>
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <ServiceBookingForm defaultService="Detailing" />
        </div>
      </div>
    </div>
  );
};

export default Detailing;
