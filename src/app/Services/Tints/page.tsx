import React from "react";
import Link from "next/link";
import { Shield, CheckCircle, Clock, Sun, ArrowLeft, Eye } from "lucide-react";

const Tints = () => {
  const tintOptions = [
    {
      name: "Ceramic Premium",
      type: "Ceramic",
      price: "£400-£800",
      vlt: "5%, 20%, 35%, 50%",
      warranty: "Lifetime",
      description:
        "Top-tier ceramic film with superior heat rejection and clarity",
      features: [
        "99% UV protection",
        "Superior heat rejection (up to 80%)",
        "No signal interference",
        "Fade resistant",
        "Scratch resistant",
        "Lifetime warranty",
      ],
      popular: true,
    },
    {
      name: "Carbon Series",
      type: "Carbon",
      price: "£300-£600",
      vlt: "5%, 20%, 35%, 50%",
      warranty: "10 Years",
      description:
        "Advanced carbon technology for excellent performance and durability",
      features: [
        "99% UV protection",
        "Good heat rejection (up to 60%)",
        "Non-metallic (no interference)",
        "Matte finish appearance",
        "Color stable",
        "10-year warranty",
      ],
      popular: false,
    },
    {
      name: "Dyed Film",
      type: "Traditional",
      price: "£200-£400",
      vlt: "5%, 20%, 35%, 50%",
      warranty: "5 Years",
      description:
        "Quality dyed film offering good privacy and basic heat rejection",
      features: [
        "95% UV protection",
        "Basic heat rejection (up to 35%)",
        "Good privacy",
        "Cost-effective",
        "Professional installation",
        "5-year warranty",
      ],
      popular: false,
    },
  ];

  const benefits = [
    {
      icon: Sun,
      title: "Heat Reduction",
      description: "Blocks up to 80% of solar heat, keeping your car cooler",
    },
    {
      icon: Shield,
      title: "UV Protection",
      description: "99% UV ray blocking protects you and your interior",
    },
    {
      icon: Eye,
      title: "Enhanced Privacy",
      description: "Increased privacy while maintaining clear visibility",
    },
    {
      icon: CheckCircle,
      title: "Interior Protection",
      description: "Prevents fading and cracking of dashboard and upholstery",
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
      <div className="mb-16 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <Shield size={40} />
        </div>
        <h1 className="mb-6 text-4xl font-bold text-gray-900 lg:text-5xl">
          Professional Window Tinting
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
          Protect your vehicle and enhance your driving experience with our
          premium window tinting services. Choose from multiple film types and
          tint levels to match your style and needs.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Professional Installation
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-500" />
            2-4 Hour Service
          </div>
          <div className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-purple-500" />
            Warranty Included
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mb-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Why Choose Window Tinting?
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 text-center transition-shadow duration-300 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <IconComponent size={32} />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tint Options */}
      <div className="mb-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Tint Film Options
        </h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {tintOptions.map((option, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border-2 bg-white p-8 ${
                option.popular
                  ? "scale-105 transform border-purple-500 shadow-lg"
                  : "border-gray-200 hover:border-purple-300 hover:shadow-md"
              } transition-all duration-300`}
            >
              {option.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="rounded-full bg-purple-500 px-4 py-2 text-sm font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6 text-center">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  {option.name}
                </h3>
                <div className="mb-2 text-lg font-medium text-purple-600">
                  {option.type} Film
                </div>
                <div className="mb-2 text-3xl font-bold text-purple-600">
                  {option.price}
                </div>
                <p className="text-gray-600">{option.description}</p>
              </div>

              <div className="mb-6 space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex justify-between">
                    <span className="font-medium text-gray-700">
                      VLT Options:
                    </span>
                    <span className="text-gray-600">{option.vlt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Warranty:</span>
                    <span className="text-gray-600">{option.warranty}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {option.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <CheckCircle className="mt-0.5 mr-3 h-4 w-4 shrink-0 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`mailto:info@carsales.com?subject=Window Tinting Quote - ${option.name}&body=Hi, I'd like to get a quote for ${option.name} window tinting. Please provide pricing and availability.`}
                  className={`block w-full rounded-lg px-6 py-3 text-center font-medium transition-colors duration-200 ${
                    option.popular
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  Get Quote
                </a>
                <a
                  href={`tel:(555)123-4567`}
                  className="block w-full rounded-lg bg-gray-100 px-6 py-3 text-center font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                >
                  Call for Details
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VLT Guide */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
          Tint Darkness Guide (VLT)
        </h2>
        <div className="rounded-2xl bg-gray-50 p-8">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-900">
                <span className="font-bold text-white">5%</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">5% VLT</h3>
              <p className="text-sm text-gray-600">
                Very dark, maximum privacy. Often called &ldquo;limo tint&rdquo;
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-700">
                <span className="font-bold text-white">20%</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">20% VLT</h3>
              <p className="text-sm text-gray-600">
                Dark tint, good privacy while maintaining visibility
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-500">
                <span className="font-bold text-white">35%</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">35% VLT</h3>
              <p className="text-sm text-gray-600">
                Medium tint, popular choice for all windows
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-300">
                <span className="font-bold text-gray-800">50%</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">50% VLT</h3>
              <p className="text-sm text-gray-600">
                Light tint, subtle appearance with UV protection
              </p>
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Legal Notice:</strong> Please check your local laws for
              legal tint limits. We&apos;ll help ensure your tint complies with
              local regulations.
            </p>
          </div>
        </div>
      </div>

      {/* Installation Process */}
      <div className="mb-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Our Installation Process
        </h2>
        <div className="grid gap-6 md:grid-cols-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">
              1
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Consultation</h3>
            <p className="text-sm text-gray-600">
              Discuss your needs and legal requirements
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">
              2
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Preparation</h3>
            <p className="text-sm text-gray-600">
              Clean windows and prepare workspace
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">
              3
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Cutting</h3>
            <p className="text-sm text-gray-600">
              Precision cut film to exact measurements
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">
              4
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Installation</h3>
            <p className="text-sm text-gray-600">
              Professional application with no bubbles
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">
              5
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Quality Check</h3>
            <p className="text-sm text-gray-600">
              Final inspection and care instructions
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="rounded-2xl bg-purple-500 p-8 text-center text-white lg:p-12">
        <h2 className="mb-4 text-3xl font-bold">
          Ready to Enhance Your Vehicle?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-purple-100">
          Get professional window tinting installed by our certified experts.
          Contact us for a free quote today.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="mailto:info@carsales.com?subject=Window Tinting Quote Request&body=Hi, I'd like to get a quote for window tinting. Please contact me to discuss options and pricing."
            className="rounded-lg bg-white px-8 py-3 font-medium text-purple-500 transition-colors duration-200 hover:bg-gray-100"
          >
            Get Free Quote
          </a>
          <a
            href="tel:(555)123-4567"
            className="rounded-lg border border-purple-400 bg-purple-600 px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-purple-700"
          >
            Call (555) 123-4567
          </a>
        </div>
      </div>
    </div>
  );
};

export default Tints;
