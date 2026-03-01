import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Shield,
  Wrench,
  Clock,
  CheckCircle,
  Star,
} from "lucide-react";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";

const Services = () => {
  const mainServices = [
    {
      id: "detailing",
      title: "Car Detailing",
      description:
        "Premium car detailing services to keep your vehicle looking pristine and protected.",
      icon: Sparkles,
      features: [
        "Interior & Exterior Deep Clean",
        "Paint Protection & Waxing",
        "Leather Treatment",
        "Engine Bay Cleaning",
        "Ceramic Coating Available",
      ],
      priceRange: "£150 - £500",
      duration: "3-6 hours",
      href: "/Services/Detailing",
      image: "/car.jpg",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "tints",
      title: "Window Tinting",
      description:
        "Professional window tinting for enhanced privacy, UV protection, and style.",
      icon: Shield,
      features: [
        "Premium Film Quality",
        "UV Ray Protection",
        "Heat Reduction",
        "Privacy Enhancement",
        "Lifetime Warranty",
      ],
      priceRange: "£200 - £800",
      duration: "2-4 hours",
      href: "/Services/Tints",
      image: "/car.jpg",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
    },
    {
      id: "repairs",
      title: "Auto Repairs",
      description:
        "Expert automotive repair services for all makes and models with certified technicians.",
      icon: Wrench,
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
      image: "/car.jpg",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="mb-6 text-4xl font-bold text-gray-900 lg:text-5xl">
          Professional Auto Services
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
          From premium detailing to expert repairs, we provide comprehensive
          automotive services to keep your vehicle in peak condition. All
          services backed by our satisfaction guarantee.
        </p>
        <div className="flex items-center justify-center gap-4 space-x-8 text-sm text-gray-500">
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
      <div className="mb-16 grid gap-8 lg:grid-cols-3">
        {mainServices.map((service) => {
          const IconComponent = service.icon;
          return (
            <div
              key={service.id}
              className={`${service.bgColor} group rounded-2xl border border-gray-200 p-8 transition-all duration-300 hover:shadow-lg`}
            >
              {/* Service Header */}
              <div className="mb-6 text-center">
                <div
                  className={`inline-flex h-16 w-16 items-center justify-center ${service.iconColor} mb-4 rounded-full bg-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                >
                  <IconComponent size={32} />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>

              {/* Service Image */}
              <div className="relative mb-6 h-48 overflow-hidden rounded-lg bg-gray-200">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="bg-opacity-20 group-hover:bg-opacity-10 absolute inset-0 bg-black transition-all duration-300"></div>
              </div>

              {/* Features List */}
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-gray-900">
                  What&apos;s Included:
                </h4>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mt-0.5 mr-2 h-4 w-4 shrink-0 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing & Duration */}
              <div className="mb-6 border-t border-gray-200 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Price Range:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {service.priceRange}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Duration:
                  </span>
                  <span className="text-sm text-gray-700">
                    {service.duration}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Link
                  href={service.href}
                  className={`w-full ${service.buttonColor} block rounded-lg px-6 py-3 text-center font-medium text-white transition-colors duration-200`}
                >
                  Learn More & Book
                </Link>
                <Link
                  href={`mailto:info@carsales.com?subject=Inquiry about ${service.title}&body=Hi, I'm interested in learning more about your ${service.title} services. Please provide more details and pricing information.`}
                  className="block w-full rounded-lg bg-gray-200 px-6 py-3 text-center font-medium text-gray-800 transition-colors duration-200 hover:bg-gray-300"
                >
                  Email Inquiry
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why Choose Us Section */}
      <div className="mb-16 rounded-2xl bg-gray-50 p-8 lg:p-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Why Choose Our Services?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            We combine years of experience with state-of-the-art equipment to
            deliver exceptional results that exceed your expectations.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <CheckCircle size={24} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">
              Quality Guarantee
            </h3>
            <p className="text-sm text-gray-600">
              100% satisfaction guaranteed on all services
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <Clock size={24} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">
              Fast Turnaround
            </h3>
            <p className="text-sm text-gray-600">
              Quick and efficient service without compromising quality
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <Star size={24} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Expert Team</h3>
            <p className="text-sm text-gray-600">
              Certified professionals with years of experience
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <Shield size={24} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Fully Insured</h3>
            <p className="text-sm text-gray-600">
              Complete coverage for your peace of mind
            </p>
          </div>
        </div>
      </div>

      {/* Book a Service */}
      <div id="book" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            Book a Service
          </h2>
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
