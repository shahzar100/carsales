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
          className="inline-flex items-center font-medium text-red-600 hover:text-red-700"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Services
        </Link>
      </div>

      {/* Hero Section */}
      <div className="mb-16 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Wrench size={40} />
        </div>
        <h1 className="mb-6 text-4xl font-bold text-gray-900 lg:text-5xl">
          Expert Auto Repair Services
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
          Professional automotive repair services for all makes and models. Our
          certified technicians use state-of-the-art diagnostic equipment to get
          you back on the road safely and efficiently.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            ASE Certified Technicians
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-500" />
            Same Day Service Available
          </div>
          <div className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-purple-500" />
            Warranty on All Work
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="mb-16">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="mr-4 h-8 w-8 text-red-500" />
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="tel:(555)123-4567"
                className="rounded-lg bg-red-500 px-6 py-2 text-center font-medium text-white transition-colors duration-200 hover:bg-red-600"
              >
                Call Emergency Line
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="mb-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Our Repair Services
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {repairServices.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-8 transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="mb-6 flex items-center">
                  <div
                    className={`${category.color} mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white`}
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
                      <CheckCircle className="mr-3 h-4 w-4 shrink-0 text-green-500" />
                      <span className="text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <a
                    href={`mailto:info@carsales.com?subject=Repair Service Inquiry - ${category.category}&body=Hi, I need repair services for ${category.category}. Please provide a quote and available appointment times.`}
                    className="block w-full rounded-lg bg-gray-900 px-6 py-3 text-center font-medium text-white transition-colors duration-200 hover:bg-gray-800"
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
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
          Emergency & Roadside Services
        </h2>
        <div className="rounded-2xl bg-linear-to-r from-red-500 to-orange-500 p-8 text-white">
          <div className="mb-8 text-center">
            <h3 className="mb-4 text-2xl font-bold">24/7 Emergency Support</h3>
            <p className="text-lg text-red-100">
              Stranded on the road? We&apost;re here to help with immediate
              assistance.
            </p>
          </div>
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            {emergencyServices.map((service, index) => (
              <div key={index} className="text-center">
                <div className="bg-opacity-20 rounded-lg bg-white p-4">
                  <span className="font-medium">{service}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href="tel:(555)123-4567"
              className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-lg font-bold text-red-500 transition-colors duration-200 hover:bg-gray-100"
            >
              <AlertCircle className="mr-2" size={24} />
              Emergency: (555) 123-4567
            </a>
          </div>
        </div>
      </div>

      {/* Repair Process */}
      <div className="mb-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Our Repair Process
        </h2>
        <div className="grid gap-6 md:grid-cols-5">
          {repairProcess.map((process, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
                {process.step}
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">
                {process.title}
              </h3>
              <p className="text-sm text-gray-600">{process.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="mb-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Why Choose Our Repair Shop?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <CheckCircle size={32} />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Certified Expertise
            </h3>
            <p className="text-gray-600">
              ASE certified technicians with years of experience on all vehicle
              makes and models.
            </p>
          </div>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Shield size={32} />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Quality Guarantee
            </h3>
            <p className="text-gray-600">
              All repairs backed by comprehensive warranty and satisfaction
              guarantee.
            </p>
          </div>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Clock size={32} />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
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
      <div className="rounded-2xl bg-gray-900 p-8 text-white lg:p-12">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Need Auto Repair Services?
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-300">
            Get professional diagnosis and repair from our certified
            technicians. Contact us for a detailed quote and service
            appointment.
          </p>
        </div>

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-xl bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-semibold">
              Non-Emergency Repairs
            </h3>
            <p className="mb-4 text-gray-300">
              Email us details about your vehicle&apost;s issues for accurate
              diagnosis and pricing.
            </p>
            <a
              href="mailto:info@carsales.com?subject=Auto Repair Service Request&body=Hi, I need auto repair services. Here are the details about my vehicle and the issues I'm experiencing:%0D%0A%0D%0AVehicle Make/Model/Year:%0D%0ASymptoms/Issues:%0D%0APreferred contact method:%0D%0A%0D%0APlease provide a quote and available appointment times."
              className="inline-block rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-green-700"
            >
              Email for Quote
            </a>
          </div>

          <div className="rounded-xl bg-red-700 p-6">
            <h3 className="mb-4 text-xl font-semibold">Emergency Repairs</h3>
            <p className="mb-4 text-red-100">
              Need immediate assistance? Call our emergency line for rapid
              response.
            </p>
            <a
              href="tel:(555)123-4567"
              className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-red-700 transition-colors duration-200 hover:bg-gray-100"
            >
              Call Emergency Line
            </a>
          </div>
        </div>

        <div className="text-center">
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-lg bg-gray-700 px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-gray-600"
            >
              Visit Our Location
            </Link>
            <a
              href="mailto:info@carsales.com"
              className="rounded-lg border border-gray-600 bg-transparent px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-gray-800"
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
