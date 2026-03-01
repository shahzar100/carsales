import React from "react";
import Link from "next/link";
import { Clock, CheckCircle, Star, Shield } from "lucide-react";
import {
  PackageGrid,
  PackageCard,
  FeatureList,
  InfoBox,
} from "@/components/Services/Common";
import type { AccentColor } from "@/components/Services/Common/PackageCard";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";

const Services = () => {
  const mainServices: {
    id: string;
    title: string;
    subtitle: string;
    features: string[];
    priceRange: string;
    duration: string;
    href: string;
    accent: AccentColor;
  }[] = [
    {
      id: "detailing",
      title: "Car Detailing",
      subtitle: "Premium interior & exterior care",
      features: [
        "Interior & Exterior Deep Clean",
        "Paint Protection & Waxing",
        "Leather Treatment",
        "Engine Bay Cleaning",
        "Ceramic Coating Available",
      ],
      priceRange: "£150 – £500",
      duration: "3-6 hours",
      href: "/Services/Detailing",
      accent: "blue",
    },
    {
      id: "tints",
      title: "Window Tinting",
      subtitle: "Privacy, UV protection & style",
      features: [
        "Premium Film Quality",
        "UV Ray Protection",
        "Heat Reduction",
        "Privacy Enhancement",
        "Lifetime Warranty",
      ],
      priceRange: "£200 – £800",
      duration: "2-4 hours",
      href: "/Services/Tints",
      accent: "purple",
    },
    {
      id: "repairs",
      title: "Auto Repairs",
      subtitle: "Expert service for all makes & models",
      features: [
        "Engine Diagnostics",
        "Brake System Repair",
        "Transmission Service",
        "Electrical Systems",
        "Preventive Maintenance",
      ],
      priceRange: "Quote on Request",
      duration: "1-5 days",
      href: "/Services/Repairs",
      accent: "green",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="page-title mb-6">Professional Auto Services</h1>
        <p className="description mx-auto mb-8 max-w-3xl">
          From premium detailing to expert repairs, we provide comprehensive
          automotive services to keep your vehicle in peak condition. All
          services backed by our satisfaction guarantee.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500 sm:gap-6">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Certified Technicians
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-5 w-5 text-blue-500" />
            Same Day Service
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 text-yellow-500" />
            5-Star Rated
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <PackageGrid title="Our Services">
        {mainServices.map((service) => (
          <PackageCard
            key={service.id}
            name={service.title}
            subtitle={service.subtitle}
            price={service.priceRange}
            extra={service.duration}
            accent={service.accent}
            footer={
              <Link
                href={service.href}
                className={`block w-full rounded-lg px-6 py-3 text-center font-medium text-white transition-colors duration-200 ${
                  service.accent === "blue"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : service.accent === "purple"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Learn More & Book
              </Link>
            }
          >
            <div className="space-y-3">
              <FeatureList
                features={service.features}
                accent={service.accent}
              />
              <InfoBox
                rows={[
                  { label: "Price Range:", value: service.priceRange },
                  { label: "Duration:", value: service.duration },
                ]}
              />
            </div>
          </PackageCard>
        ))}
      </PackageGrid>

      {/* Why Choose Us Section */}
      <div className="mb-16 rounded-2xl bg-gray-50 p-8 lg:p-12">
        <div className="mb-12 text-center">
          <h2 className="section-title mb-4">Why Choose Our Services?</h2>
          <p className="description mx-auto max-w-2xl">
            We combine years of experience with state-of-the-art equipment to
            deliver exceptional results that exceed your expectations.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <CheckCircle size={24} />
            </div>
            <h3 className="heading-4 mb-2">Quality Guarantee</h3>
            <p className="text-sm text-gray-600">
              100% satisfaction guaranteed on all services
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <Clock size={24} />
            </div>
            <h3 className="heading-4 mb-2">Fast Turnaround</h3>
            <p className="text-sm text-gray-600">
              Quick and efficient service without compromising quality
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <Star size={24} />
            </div>
            <h3 className="heading-4 mb-2">Expert Team</h3>
            <p className="text-sm text-gray-600">
              Certified professionals with years of experience
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <Shield size={24} />
            </div>
            <h3 className="heading-4 mb-2">Fully Insured</h3>
            <p className="text-sm text-gray-600">
              Complete coverage for your peace of mind
            </p>
          </div>
        </div>
      </div>

      {/* Book a Service */}
      <div id="book" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="section-title mb-2">Book a Service</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Ready to get started? Fill in the form below to schedule your
            appointment.
          </p>
        </div>
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <ServiceBookingForm />
        </div>
      </div>
    </div>
  );
};

export default Services;
