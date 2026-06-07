import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  CheckCircle,
  Clock,
  Sun,
  Eye,
  ArrowRight,
  Palette,
  SprayCan,
  Layers,
  Sparkles,
} from "lucide-react";
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
  title: "Window Tints & Car Wrapping",
  description:
    "Professional window tinting and car wrapping in Leeds. Ceramic, carbon, and dyed films from £200, plus full and partial vinyl wraps for a complete colour change. Warranty included.",
  alternates: { canonical: "/Services/Tints" },
  openGraph: {
    title: "Window Tints & Car Wrapping",
    description:
      "Professional window tinting and full or partial car wrapping. Premium films and vinyl, expertly installed with warranty included.",
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

const wrappingBenefits = [
  {
    icon: Palette,
    title: "Full Colour Change",
    description:
      "Transform your car's look with gloss, matte, satin, or chrome finishes",
  },
  {
    icon: Layers,
    title: "Full & Partial Wraps",
    description:
      "Wrap the whole vehicle or just roofs, mirrors, bonnets and accents",
  },
  {
    icon: Shield,
    title: "Paintwork Protection",
    description:
      "Vinyl shields your original paint from stone chips and UV fading",
  },
  {
    icon: SprayCan,
    title: "Reversible & Resale",
    description:
      "Removable without damaging the factory paint underneath",
  },
];

const heroProps = {
  icon: Shield,
  iconBgColor: "bg-red-100 text-red-700",
  title: "Window Tints & Car Wrapping",
  description:
    "Protect your vehicle and transform its look. From premium window tinting to full and partial vinyl wraps, choose the film types, tint levels, and finishes that match your style — all expertly installed.",
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
          name: "Window Tints & Car Wrapping",
          description:
            "Professional window tinting and car wrapping. Ceramic, carbon, and dyed films from £200, plus full and partial vinyl wraps for a complete colour change. Warranty included.",
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

      {/* Car Wrapping */}
      <div className="mb-8 md:mb-16">
        <div className="mb-6 text-center md:mb-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <Sparkles size={26} />
          </div>
          <h2 className="section-title mb-2">Car Wrapping</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Want a whole new look? Our vinyl wrapping service gives your car a
            complete colour change — gloss, matte, satin, or chrome — while
            protecting the paintwork underneath. Choose a full wrap or accent
            individual panels.
          </p>
        </div>
        <BenefitsGrid
          benefits={wrappingBenefits}
          title="Why Wrap Your Car?"
          columns={4}
        />
      </div>

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
