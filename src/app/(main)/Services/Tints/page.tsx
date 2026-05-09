import React from "react";
import type { Metadata } from "next";
import { Shield, CheckCircle, Clock, Sun, Eye } from "lucide-react";
import {
  ServiceHero,
  BackNavigation,
  ProcessFlow,
  BenefitsGrid,
  BlackRedSection,
} from "@/components/Services/Common";
import { TintOptionsGrid, VLTGuide } from "@/components/Services/Tints";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";
import { JsonLd } from "@/components/SEO/JsonLd";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

export const metadata: Metadata = {
  title: "Window Tinting Services",
  description:
    "Professional window tinting with ceramic, carbon, and dyed film options from £200. 99% UV protection, heat reduction, and enhanced privacy. Warranty included.",
  alternates: { canonical: "/Services/Tints" },
  openGraph: {
    title: "Window Tinting Services",
    description:
      "Professional window tinting with ceramic, carbon, and dyed film options from £200. Warranty included.",
    url: "/Services/Tints",
  },
};

const Tints = async () => {
  const businessInfo = await getBusinessInfo();
  const tintOptions = businessInfo.tintOptions!;

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

  const installationProcess = [
    {
      step: 1,
      title: "Consultation",
      description: "Discuss your needs and legal requirements",
    },
    {
      step: 2,
      title: "Preparation",
      description: "Clean windows and prepare workspace",
    },
    {
      step: 3,
      title: "Cutting",
      description: "Precision cut film to exact measurements",
    },
    {
      step: 4,
      title: "Installation",
      description: "Professional application with no bubbles",
    },
    {
      step: 5,
      title: "Quality Check",
      description: "Final inspection and care instructions",
    },
  ];

  const heroProps = {
    icon: Shield,
    iconBgColor: "bg-red-100 text-red-700",
    title: "Professional Window Tinting",
    description:
      "Protect your vehicle and enhance your driving experience with our premium window tinting services. Choose from multiple film types and tint levels to match your style and needs.",
    badges: [
      {
        icon: CheckCircle,
        text: "Professional Installation",
        color: "text-red-500",
      },
      { icon: Clock, text: "2-4 Hour Service", color: "text-gray-900" },
      { icon: Shield, text: "Warranty Included", color: "text-red-700" },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Window Tinting Services",
          description:
            "Professional window tinting with ceramic, carbon, and dyed film options from £200. 99% UV protection, heat reduction, and enhanced privacy. Warranty included.",
          provider: {
            "@type": "AutoDealer",
            name: businessInfo.businessName,
          },
          areaServed: { "@type": "City", name: businessInfo.city },
          priceRange: "£200 – £500",
        }}
      />
      <BackNavigation href="/Services" text="Back to Services" />

      <ServiceHero {...heroProps} />

      <BlackRedSection>
        <BenefitsGrid
          benefits={benefits}
          title="Why Choose Window Tinting?"
          columns={4}
          dark
        />
      </BlackRedSection>

      <TintOptionsGrid tintOptions={tintOptions} />

      <VLTGuide />

      <BlackRedSection>
        <ProcessFlow
          title="Our Installation Process"
          steps={installationProcess}
          dark
        />
      </BlackRedSection>

      {/* Book Window Tinting */}
      <div id="book" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="section-title mb-2">Book Your Window Tinting</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Fill in the form below and we&apos;ll confirm your appointment.
          </p>
        </div>
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <ServiceBookingForm defaultService="Window Tint" />
        </div>
      </div>
    </div>
  );
};

export default Tints;
