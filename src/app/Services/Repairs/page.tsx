import React from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle,
  Clock,
  Shield,
  ArrowLeft,
  AlertCircle,
  Zap,
  Settings,
} from "lucide-react";

const Repairs = () => {
  const repairServices = [
    {
      category: "Engine & Performance",
      icon: Settings,
      color: "bg-red-500",
      services: [
        "Engine Diagnostics",
        "Oil Changes & Fluid Services",
        "Timing Belt Replacement",
        "Fuel System Cleaning",
        "Engine Tune-ups",
        "Performance Upgrades",
      ],
    },
    {
      category: "Brakes & Safety",
      icon: Shield,
      color: "bg-orange-500",
      services: [
        "Brake Pad Replacement",
        "Brake Fluid Service",
        "Rotor Resurfacing",
        "ABS System Repair",
        "Brake Line Repair",
        "Emergency Brake Adjustment",
      ],
    },
    {
      category: "Electrical Systems",
      icon: Zap,
      color: "bg-yellow-500",
      services: [
        "Battery Testing & Replacement",
        "Alternator Repair",
        "Starter Motor Service",
        "Wiring Diagnostics",
        "Lighting System Repair",
        "Electronic Module Programming",
      ],
    },
    {
      category: "Transmission & Drivetrain",
      icon: Wrench,
      color: "bg-blue-500",
      services: [
        "Transmission Service",
        "Clutch Replacement",
        "CV Joint Repair",
        "Differential Service",
        "Driveshaft Repair",
        "Transfer Case Service",
      ],
    },
  ];

  const emergencyServices = [
    "Roadside Assistance",
    "Jump Start Service",
    "Flat Tire Repair",
    "Lockout Service",
    "Emergency Towing",
    "24/7 Diagnostic",
  ];

  const repairProcess = [
    {
      step: 1,
      title: "Initial Consultation",
      description:
        "Email us your vehicle issues and symptoms for preliminary assessment",
    },
    {
      step: 2,
      title: "Diagnostic Evaluation",
      description: "Comprehensive computer diagnostics and visual inspection",
    },
    {
      step: 3,
      title: "Detailed Quote",
      description:
        "Transparent pricing with breakdown of parts and labor costs",
    },
    {
      step: 4,
      title: "Repair Execution",
      description: "Expert repair using quality parts and proven techniques",
    },
    {
      step: 5,
      title: "Quality Assurance",
      description: "Post-repair testing and multi-point inspection",
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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6">
          <Wrench size={40} />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Expert Auto Repair Services
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Professional automotive repair services for all makes and models. Our
          certified technicians use state-of-the-art diagnostic equipment to get
          you back on the road safely and efficiently.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ASE Certified Technicians
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            Same Day Service Available
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-purple-500 mr-2" />
            Warranty on All Work
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="mb-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  Emergency Repair Services
                </h3>
                <p className="text-red-700">
                  Need immediate assistance? We offer 24/7 emergency repair
                  services.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="tel:(555)123-4567"
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium text-center transition-colors duration-200"
              >
                Call Emergency Line
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Our Repair Services
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {repairServices.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-6">
                  <div
                    className={`${category.color} text-white w-12 h-12 rounded-full flex items-center justify-center mr-4`}
                  >
                    <IconComponent size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {category.category}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {category.services.map((service, idx) => (
                    <div key={idx} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <a
                    href={`mailto:info@carsales.com?subject=Repair Service Inquiry - ${category.category}&body=Hi, I need repair services for ${category.category}. Please provide a quote and available appointment times.`}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-medium text-center block transition-colors duration-200"
                  >
                    Get Quote for {category.category}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Services */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Emergency & Roadside Services
        </h2>
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">24/7 Emergency Support</h3>
            <p className="text-lg text-red-100">
              Stranded on the road? We're here to help with immediate
              assistance.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {emergencyServices.map((service, index) => (
              <div key={index} className="text-center">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <span className="font-medium">{service}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href="tel:(555)123-4567"
              className="inline-flex items-center bg-white text-red-500 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold text-lg transition-colors duration-200"
            >
              <AlertCircle className="mr-2" size={24} />
              Emergency: (555) 123-4567
            </a>
          </div>
        </div>
      </div>

      {/* Repair Process */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Our Repair Process
        </h2>
        <div className="grid md:grid-cols-5 gap-6">
          {repairProcess.map((process, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                {process.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {process.title}
              </h3>
              <p className="text-gray-600 text-sm">{process.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Why Choose Our Repair Shop?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Certified Expertise
            </h3>
            <p className="text-gray-600">
              ASE certified technicians with years of experience on all vehicle
              makes and models.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Quality Guarantee
            </h3>
            <p className="text-gray-600">
              All repairs backed by comprehensive warranty and satisfaction
              guarantee.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Fast Turnaround
            </h3>
            <p className="text-gray-600">
              Efficient service with most repairs completed within 1-2 business
              days.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-900 text-white rounded-2xl p-8 lg:p-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            Need Auto Repair Services?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get professional diagnosis and repair from our certified
            technicians. Contact us for a detailed quote and service
            appointment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">
              Non-Emergency Repairs
            </h3>
            <p className="text-gray-300 mb-4">
              Email us details about your vehicle's issues for accurate
              diagnosis and pricing.
            </p>
            <a
              href="mailto:info@carsales.com?subject=Auto Repair Service Request&body=Hi, I need auto repair services. Here are the details about my vehicle and the issues I'm experiencing:%0D%0A%0D%0AVehicle Make/Model/Year:%0D%0ASymptoms/Issues:%0D%0APreferred contact method:%0D%0A%0D%0APlease provide a quote and available appointment times."
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-block transition-colors duration-200"
            >
              Email for Quote
            </a>
          </div>

          <div className="bg-red-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Emergency Repairs</h3>
            <p className="text-red-100 mb-4">
              Need immediate assistance? Call our emergency line for rapid
              response.
            </p>
            <a
              href="tel:(555)123-4567"
              className="bg-white text-red-700 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium inline-block transition-colors duration-200"
            >
              Call Emergency Line
            </a>
          </div>
        </div>

        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Visit Our Location
            </Link>
            <a
              href="mailto:info@carsales.com"
              className="bg-transparent hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 border border-gray-600"
            >
              General Inquiries
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Repairs;
