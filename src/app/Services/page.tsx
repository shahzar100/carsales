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
      priceRange: "$150 - $500",
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
      priceRange: "$200 - $800",
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
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Professional Auto Services
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          From premium detailing to expert repairs, we provide comprehensive
          automotive services to keep your vehicle in peak condition. All
          services backed by our satisfaction guarantee.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 gap-4">
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
      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        {mainServices.map((service) => {
          const IconComponent = service.icon;
          return (
            <div
              key={service.id}
              className={`${service.bgColor} rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300 group`}
            >
              {/* Service Header */}
              <div className="text-center mb-6">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 ${service.iconColor} bg-white rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>

              {/* Service Image */}
              <div className="relative h-48 bg-gray-200 rounded-lg overflow-hidden mb-6">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>

              {/* Features List */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  What&apos;s Included:
                </h4>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing & Duration */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Price Range:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {service.priceRange}
                  </span>
                </div>
                <div className="flex justify-between items-center">
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
                  className={`w-full ${service.buttonColor} text-white py-3 px-6 rounded-lg font-medium text-center block transition-colors duration-200`}
                >
                  Learn More & Book
                </Link>
                <Link
                  href={`mailto:info@carsales.com?subject=Inquiry about ${service.title}&body=Hi, I'm interested in learning more about your ${service.title} services. Please provide more details and pricing information.`}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium text-center block transition-colors duration-200"
                >
                  Email Inquiry
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-gray-50 rounded-2xl p-8 lg:p-12 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose Our Services?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We combine years of experience with state-of-the-art equipment to
            deliver exceptional results that exceed your expectations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Quality Guarantee
            </h3>
            <p className="text-sm text-gray-600">
              100% satisfaction guaranteed on all services
            </p>
          </div>

          <div className="text-center">
            <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Fast Turnaround
            </h3>
            <p className="text-sm text-gray-600">
              Quick and efficient service without compromising quality
            </p>
          </div>

          <div className="text-center">
            <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Expert Team</h3>
            <p className="text-sm text-gray-600">
              Certified professionals with years of experience
            </p>
          </div>

          <div className="text-center">
            <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fully Insured</h3>
            <p className="text-sm text-gray-600">
              Complete coverage for your peace of mind
            </p>
          </div>
        </div>
      </div>

      {/* Contact CTA Section */}
      <div className="bg-red-500 text-white rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
          Contact us today for a free quote or to schedule your service
          appointment. We&apos;re here to keep your vehicle running and looking
          its best.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="tel:(555)123-4567"
            className=" text-red-500 bg-white hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Call (555) 123-4567
          </Link>
          <Link
            href="mailto:info@carsales.com"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 border border-red-400"
          >
            Email Us
          </Link>
          <Link
            href="/contact"
            className="bg-transparent hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 border border-red-400"
          >
            Visit Our Location
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
