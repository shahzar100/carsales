import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Settings,
  Gauge,
  Cog,
  Sparkles,
  Disc3,
  Zap,
  CheckCircle,
  Shield,
  ArrowRight,
} from "lucide-react";
import {
  ServiceHero,
  BackNavigation,
  ProcessFlow,
  WhyChooseUs,
  BlackRedSection,
} from "@/components/Services/Common";
import { JsonLd } from "@/components/SEO/JsonLd";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

// Cached per-page (no longer force-dynamic via layout). Audit #1.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Vehicle Modifications",
  description:
    "Professional vehicle modifications in Leeds — performance remaps, suspension, alloy wheels, exhausts, and bespoke styling. Quality parts, expert fitting, and honest advice.",
  alternates: { canonical: "/Services/Modifications" },
  openGraph: {
    title: "Vehicle Modifications",
    description:
      "Performance remaps, suspension, alloys, exhausts, and bespoke styling — fitted by experienced technicians.",
    url: "/Services/Modifications",
  },
};

const modificationCategories = [
  {
    category: "Performance & Tuning",
    icon: Gauge,
    color: "bg-red-500",
    services: [
      "ECU Remapping & Tuning",
      "Stage 1 & Stage 2 Upgrades",
      "Induction & Intake Kits",
      "Intercooler Upgrades",
      "Diagnostics & Dyno Setup",
    ],
  },
  {
    category: "Exhaust Systems",
    icon: Zap,
    color: "bg-orange-500",
    services: [
      "Cat-Back & Turbo-Back Systems",
      "Sports Cats & Downpipes",
      "Custom Exhaust Fabrication",
      "Backbox Delete & Valved Systems",
      "Emissions-Conscious Setups",
    ],
  },
  {
    category: "Suspension & Handling",
    icon: Cog,
    color: "bg-yellow-500",
    services: [
      "Lowering Springs & Coilovers",
      "Performance Dampers",
      "Anti-Roll Bars",
      "Geometry & Alignment",
      "Brake Upgrades",
    ],
  },
  {
    category: "Styling & Wheels",
    icon: Sparkles,
    color: "bg-red-600",
    services: [
      "Alloy Wheels & Tyres",
      "Body Kits & Splitters",
      "Spoilers & Diffusers",
      "Interior Trim Upgrades",
      "Lighting Upgrades",
    ],
  },
];

const modificationProcess = [
  {
    step: 1,
    title: "Consultation",
    description:
      "Tell us your goals and budget — we'll advise what's achievable and road-legal",
  },
  {
    step: 2,
    title: "Tailored Quote",
    description: "Transparent pricing for parts and labour, with timescales",
  },
  {
    step: 3,
    title: "Sourcing Parts",
    description: "Quality components from trusted brands to suit your build",
  },
  {
    step: 4,
    title: "Expert Fitting",
    description: "Precision installation and setup by experienced technicians",
  },
  {
    step: 5,
    title: "Testing & Handover",
    description: "Road test, final checks, and aftercare guidance",
  },
];

const heroProps = {
  icon: Settings,
  iconBgColor: "bg-gray-100 text-gray-900",
  title: "Vehicle Modifications",
  description:
    "From subtle styling to serious performance, our team builds your car around you. We source quality parts and fit them properly — with honest advice on what's worth doing and what stays road-legal.",
  badges: [
    { icon: CheckCircle, text: "Quality Parts", color: "text-red-500" },
    { icon: Disc3, text: "Expert Fitting", color: "text-gray-900" },
    { icon: Shield, text: "Honest Advice", color: "text-red-700" },
  ],
};

const Modifications = async () => {
  const businessInfo = await getBusinessInfo();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Vehicle Modifications",
          description:
            "Performance remaps, suspension, alloy wheels, exhausts, and bespoke styling, fitted by experienced technicians.",
          provider: {
            "@type": "AutoDealer",
            name: businessInfo.businessName,
          },
          areaServed: { "@type": "City", name: businessInfo.city },
        }}
      />
      <BackNavigation href="/Services" text="Back to Services" />

      <ServiceHero {...heroProps} />

      <div className="mb-8 md:mb-16">
        <h2 className="section-title mb-6 text-center md:mb-12">
          What We Modify
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {modificationCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.category}
                className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow duration-300 hover:shadow-lg sm:p-6 lg:p-8"
              >
                <div className="mb-6 flex items-center">
                  <div
                    className={`${category.color} mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white`}
                  >
                    <IconComponent size={24} />
                  </div>
                  <h3 className="heading-3">{category.category}</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {category.services.map((service) => (
                    <div key={service} className="flex items-center">
                      <CheckCircle className="mr-3 h-4 w-4 shrink-0 text-red-500" />
                      <span className="text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BlackRedSection>
        <ProcessFlow
          title="How a Build Works"
          steps={modificationProcess}
          dark
        />
      </BlackRedSection>

      <WhyChooseUs />

      {/* Get a Modifications Quote */}
      <div id="quote" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="section-title mb-2">Get a Modifications Quote</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Every build is different. Tell us what you have in mind and we&apos;ll
            come back with options and pricing.
          </p>
        </div>
        <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-red-600 uppercase">
                No obligation
              </p>
              <p className="text-base font-bold text-gray-900">
                Tell us about your project
              </p>
              <p className="text-sm text-gray-600">
                Quality parts · Expert fitting · Road-legal advice
              </p>
            </div>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
          >
            Request a quote
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Modifications;
