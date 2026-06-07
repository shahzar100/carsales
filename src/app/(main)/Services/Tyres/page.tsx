import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Disc3,
  CircleDot,
  RotateCw,
  ShieldCheck,
  Wrench,
  Gauge,
  CheckCircle,
  Clock,
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
  title: "Brand New Tyres Supplied & Fitted",
  description:
    "Brand new tyres supplied and fitted in Leeds. All major brands and budgets, wheel balancing, puncture repairs, and TPMS reset. Fast, professional fitting on site.",
  alternates: { canonical: "/Services/Tyres" },
  openGraph: {
    title: "Brand New Tyres Supplied & Fitted",
    description:
      "All major brands and budgets, supplied and fitted on site with wheel balancing and puncture repairs.",
    url: "/Services/Tyres",
  },
};

const tyreServices = [
  {
    category: "Tyre Supply & Fitting",
    icon: CircleDot,
    color: "bg-red-500",
    services: [
      "All Major Brands Supplied",
      "Budget, Mid-Range & Premium",
      "Car, 4x4 & Van Tyres",
      "Fitted On Site",
      "Old Tyre Disposal",
    ],
  },
  {
    category: "Balancing & Alignment",
    icon: Gauge,
    color: "bg-orange-500",
    services: [
      "Computerised Wheel Balancing",
      "Tracking & Alignment",
      "Vibration Diagnosis",
      "Even-Wear Checks",
    ],
  },
  {
    category: "Repairs & Maintenance",
    icon: Wrench,
    color: "bg-yellow-500",
    services: [
      "Puncture Repairs",
      "Valve Replacement",
      "TPMS Reset & Service",
      "Tyre Pressure Checks",
      "Tread & Safety Inspection",
    ],
  },
  {
    category: "Seasonal & Performance",
    icon: ShieldCheck,
    color: "bg-red-600",
    services: [
      "All-Season Tyres",
      "Winter Tyres",
      "Performance & Run-Flat",
      "Part-Worn Advice",
    ],
  },
];

const tyreProcess = [
  {
    step: 1,
    title: "Tell Us Your Size",
    description:
      "Send us your tyre size (on the sidewall) or registration and we'll match it",
  },
  {
    step: 2,
    title: "Choose Your Budget",
    description: "Options across budget, mid-range, and premium brands",
  },
  {
    step: 3,
    title: "Book a Slot",
    description: "Pop in or pre-book — most fits take 30-60 minutes",
  },
  {
    step: 4,
    title: "Supplied & Fitted",
    description: "Fitted, balanced, and checked on site by our technicians",
  },
];

const heroProps = {
  icon: Disc3,
  iconBgColor: "bg-gray-100 text-gray-900",
  title: "Brand New Tyres Supplied & Fitted",
  description:
    "Quality tyres for every budget, supplied and fitted on site. From everyday runabouts to performance cars, we'll match the right tyre to your vehicle, balance it, and have you back on the road quickly.",
  badges: [
    { icon: CheckCircle, text: "All Brands & Budgets", color: "text-red-500" },
    { icon: Clock, text: "Fast Fitting", color: "text-gray-900" },
    { icon: RotateCw, text: "Balancing Included", color: "text-red-700" },
  ],
};

const Tyres = async () => {
  const businessInfo = await getBusinessInfo();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Brand New Tyres Supplied & Fitted",
          description:
            "Brand new tyres supplied and fitted. All major brands and budgets, wheel balancing, puncture repairs, and TPMS reset.",
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
          Our Tyre Services
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {tyreServices.map((category) => {
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
        <ProcessFlow title="How It Works" steps={tyreProcess} dark />
      </BlackRedSection>

      <WhyChooseUs />

      {/* Get a Tyre Quote */}
      <div id="quote" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="section-title mb-2">Need New Tyres?</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Send us your tyre size or registration and we&apos;ll quote you the
            best options across budget and premium brands.
          </p>
        </div>
        <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
              <CircleDot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-red-600 uppercase">
                Supplied &amp; fitted
              </p>
              <p className="text-base font-bold text-gray-900">
                Get a tyre quote
              </p>
              <p className="text-sm text-gray-600">
                All brands · Balancing included · Fast turnaround
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

export default Tyres;
