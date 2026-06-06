import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, Clock, Sun, Eye, ArrowRight } from "lucide-react";
import {
  ServiceHero,
  BackNavigation,
  ProcessFlow,
  BenefitsGrid,
  BlackRedSection,
} from "@/components/Services/Common";
import { TintOptionsGrid, VLTGuide } from "@/components/Services/Tints";
import { JsonLd } from "@/components/SEO/JsonLd";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

// Cached per-page (no longer force-dynamic via layout). Audit #1.
export const revalidate = 600;

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

const Tints = async () => {
  const businessInfo = await getBusinessInfo();
  const tintOptions = businessInfo.tintOptions!;

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
            Pick a film grade and slot in our climate-controlled bay — most
            appointments confirmed within the hour.
          </p>
        </div>
        <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-red-600 uppercase">
                Step 1 of 5
              </p>
              <p className="text-base font-bold text-gray-900">
                Start your tinting booking
              </p>
              <p className="text-sm text-gray-600">
                5-year warranty · No deposit required
              </p>
            </div>
          </div>
          <Link
            href="/Book?service=tints"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
          >
            Book window tinting
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Tints;
