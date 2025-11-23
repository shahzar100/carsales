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
  ContactSection,
  WhyChooseUs,
} from "@/components/Services/Common";
import { RepairServiceGrid, EmergencyBanner } from "@/components/Services/Repairs";

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
      { icon: CheckCircle, text: "ASE Certified Technicians", color: "text-green-500" },
      { icon: Clock, text: "Same Day Service Available", color: "text-blue-500" },
      { icon: Shield, text: "Warranty on All Work", color: "text-purple-500" },
    ],
  };

  const contactActions = [
    {
      type: "email" as const,
      url: "mailto:info@carsales.com?subject=Auto Repair Service Request&body=Hi, I need auto repair services. Here are the details about my vehicle and the issues I'm experiencing:%0D%0A%0D%0AVehicle Make/Model/Year:%0D%0ASymptoms/Issues:%0D%0APreferred contact method:%0D%0A%0D%0APlease provide a quote and available appointment times.",
      text: "Email for Quote",
      style: "primary" as const,
    },
    {
      type: "phone" as const,
      url: "tel:(555)123-4567",
      text: "Call Emergency Line",
      style: "danger" as const,
    },
  ];

  const secondaryActions = [
    {
      type: "link" as const,
      url: "/contact",
      text: "Visit Our Location",
      style: "primary" as const,
    },
    {
      type: "email" as const,
      url: "mailto:info@carsales.com",
      text: "General Inquiries",
      style: "secondary" as const,
    },
  ];

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
      
      <ContactSection
        title="Need Auto Repair Services?"
        subtitle="Get professional diagnosis and repair from our certified technicians. Contact us for a detailed quote and service appointment."
        primaryActions={contactActions}
        secondaryActions={secondaryActions}
      />
    </div>
  );
};

export default Repairs;