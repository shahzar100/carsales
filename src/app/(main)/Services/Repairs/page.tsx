import React from "react";
import {
  Wrench,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Settings,
} from "lucide-react";
import {
  ServiceHero,
  BackNavigation,
  ProcessFlow,
  WhyChooseUs,
} from "@/components/Services/Common";
import {
  RepairServiceGrid,
  EmergencyBanner,
} from "@/components/Services/Repairs";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";

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

  const heroProps = {
    icon: Wrench,
    iconBgColor: "bg-green-100 text-green-600",
    title: "Expert Auto Repair Services",
    description:
      "Professional automotive repair services for all makes and models. Our certified technicians use state-of-the-art diagnostic equipment to get you back on the road safely and efficiently.",
    badges: [
      {
        icon: CheckCircle,
        text: "ASE Certified Technicians",
        color: "text-green-500",
      },
      {
        icon: Clock,
        text: "Same Day Service Available",
        color: "text-blue-500",
      },
      { icon: Shield, text: "Warranty on All Work", color: "text-purple-500" },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BackNavigation href="/Services" text="Back to Services" />

      <ServiceHero {...heroProps} />

      <EmergencyBanner emergencyServices={emergencyServices} />

      <RepairServiceGrid repairServices={repairServices} />

      <ProcessFlow
        title="Our Repair Process"
        steps={repairProcess}
        accentColor="bg-green-100 text-green-600"
      />

      <WhyChooseUs />

      {/* Book a Repair Service */}
      <div id="book" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="section-title mb-2">Book Your Repair Service</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Fill in the form below to schedule your repair appointment.
          </p>
        </div>
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <ServiceBookingForm defaultService="Repair" />
        </div>
      </div>
    </div>
  );
};

export default Repairs;
