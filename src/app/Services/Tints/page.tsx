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
          className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Services
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 text-purple-600 rounded-full mb-6">
          <Shield size={40} />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Professional Window Tinting
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Protect your vehicle and enhance your driving experience with our
          premium window tinting services. Choose from multiple film types and
          tint levels to match your style and needs.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Professional Installation
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            2-4 Hour Service
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-purple-500 mr-2" />
            Warranty Included
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Why Choose Window Tinting?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="text-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                  <IconComponent size={32} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tint Options */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Tint Film Options
        </h2>
        <div className="grid lg:grid-cols-3 gap-8">
          {tintOptions.map((option, index) => (
            <div
              key={index}
              className={`relative bg-white border-2 rounded-2xl p-8 ${
                option.popular
                  ? "border-purple-500 shadow-lg transform scale-105"
                  : "border-gray-200 hover:border-purple-300 hover:shadow-md"
              } transition-all duration-300`}
            >
              {option.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {option.name}
                </h3>
                <div className="text-lg font-medium text-purple-600 mb-2">
                  {option.type} Film
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {option.price}
                </div>
                <p className="text-gray-600">{option.description}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
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
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`mailto:info@carsales.com?subject=Window Tinting Quote - ${option.name}&body=Hi, I'd like to get a quote for ${option.name} window tinting. Please provide pricing and availability.`}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-center block transition-colors duration-200 ${
                    option.popular
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                  }`}
                >
                  Get Quote
                </a>
                <a
                  href={`tel:(555)123-4567`}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium text-center block transition-colors duration-200"
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
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Tint Darkness Guide (VLT)
        </h2>
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-900 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">5%</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">5% VLT</h3>
              <p className="text-sm text-gray-600">
                Very dark, maximum privacy. Often called &ldquo;limo tint&rdquo;
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">20%</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">20% VLT</h3>
              <p className="text-sm text-gray-600">
                Dark tint, good privacy while maintaining visibility
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">35%</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">35% VLT</h3>
              <p className="text-sm text-gray-600">
                Medium tint, popular choice for all windows
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-800 font-bold">50%</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">50% VLT</h3>
              <p className="text-sm text-gray-600">
                Light tint, subtle appearance with UV protection
              </p>
            </div>
          </div>
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Our Installation Process
        </h2>
        <div className="grid md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Consultation</h3>
            <p className="text-gray-600 text-sm">
              Discuss your needs and legal requirements
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Preparation</h3>
            <p className="text-gray-600 text-sm">
              Clean windows and prepare workspace
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Cutting</h3>
            <p className="text-gray-600 text-sm">
              Precision cut film to exact measurements
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Installation</h3>
            <p className="text-gray-600 text-sm">
              Professional application with no bubbles
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              5
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Quality Check</h3>
            <p className="text-gray-600 text-sm">
              Final inspection and care instructions
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-500 text-white rounded-2xl p-8 lg:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Enhance Your Vehicle?
        </h2>
        <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
          Get professional window tinting installed by our certified experts.
          Contact us for a free quote today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:info@carsales.com?subject=Window Tinting Quote Request&body=Hi, I'd like to get a quote for window tinting. Please contact me to discuss options and pricing."
            className="bg-white text-purple-500 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Get Free Quote
          </a>
          <a
            href="tel:(555)123-4567"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 border border-purple-400"
          >
            Call (555) 123-4567
          </a>
        </div>
      </div>
    </div>
  );
};

export default Tints;
