import React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle, Clock, Shield, ArrowLeft } from "lucide-react";

const Detailing = () => {
  const detailingPackages = [
    {
      name: "Basic Wash & Wax",
      price: "$150",
      duration: "2-3 hours",
      description: "Essential cleaning and protection for your vehicle",
      features: [
        "Exterior hand wash",
        "Interior vacuum & wipe down",
        "Tire cleaning & shine",
        "Basic wax application",
        "Window cleaning (inside & out)",
      ],
      popular: false,
    },
    {
      name: "Premium Detail",
      price: "$280",
      duration: "4-5 hours",
      description:
        "Comprehensive detailing for optimal appearance and protection",
      features: [
        "Everything in Basic package",
        "Clay bar treatment",
        "Paint correction (minor scratches)",
        "Premium carnauba wax",
        "Leather conditioning",
        "Engine bay cleaning",
        "Headlight restoration",
      ],
      popular: true,
    },
    {
      name: "Elite Ceramic Coating",
      price: "$500",
      duration: "6-8 hours",
      description: "Ultimate protection with long-lasting ceramic coating",
      features: [
        "Everything in Premium package",
        "Paint decontamination",
        "Professional paint correction",
        "Ceramic coating application",
        "2-year protection warranty",
        "Hydrophobic finish",
        "UV protection",
      ],
      popular: false,
    },
  ];

  const additionalServices = [
    { name: "Pet Hair Removal", price: "$50" },
    { name: "Odor Elimination", price: "$75" },
    { name: "Stain Removal", price: "$40" },
    { name: "Convertible Top Cleaning", price: "$80" },
    { name: "Chrome Polishing", price: "$60" },
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
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 text-blue-600 rounded-full mb-6">
          <Sparkles size={40} />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Professional Car Detailing
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Transform your vehicle with our premium detailing services. From basic
          wash and wax to advanced ceramic coating, we'll make your car look
          showroom-ready.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Eco-Friendly Products
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            Same Day Service
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-purple-500 mr-2" />
            Satisfaction Guaranteed
          </div>
        </div>
      </div>

      {/* Service Packages */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Detailing Packages
        </h2>
        <div className="grid lg:grid-cols-3 gap-8">
          {detailingPackages.map((pkg, index) => (
            <div
              key={index}
              className={`relative bg-white border-2 rounded-2xl p-8 ${
                pkg.popular
                  ? "border-blue-500 shadow-lg transform scale-105"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-md"
              } transition-all duration-300`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {pkg.name}
                </h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {pkg.price}
                </div>
                <div className="text-gray-500 mb-4">{pkg.duration}</div>
                <p className="text-gray-600">{pkg.description}</p>
              </div>

              <div className="space-y-3 mb-8">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <a
                  href={`mailto:info@carsales.com?subject=Detailing Service Booking - ${pkg.name}&body=Hi, I'd like to book the ${pkg.name} package for ${pkg.price}. Please let me know available dates and times.`}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-center block transition-colors duration-200 ${
                    pkg.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }`}
                >
                  Book This Package
                </a>
                <a
                  href={`tel:(555)123-4567`}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium text-center block transition-colors duration-200"
                >
                  Call for Quote
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Services */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Additional Services
        </h2>
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalServices.map((service, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-white rounded-lg"
              >
                <span className="font-medium text-gray-900">
                  {service.name}
                </span>
                <span className="text-blue-600 font-bold">{service.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              Add any of these services to your detailing package for the
              ultimate experience.
            </p>
            <a
              href="mailto:info@carsales.com?subject=Additional Detailing Services Inquiry&body=Hi, I'm interested in adding additional services to my detailing package. Please provide more information."
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Customize Your Package
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
              Thorough assessment of your vehicle's condition and specific needs
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
