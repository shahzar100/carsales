import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  Phone,
  Clock,
  Shield,
  MapPin,
  Battery,
  KeyRound,
  Wrench,
  AlertTriangle,
  Fuel,
  CircleDot,
} from "lucide-react";
import {
  ServiceHero,
  ProcessFlow,
  BlackRedSection,
} from "@/components/Services/Common";
import { JsonLd } from "@/components/SEO/JsonLd";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

export const metadata: Metadata = {
  title: "Vehicle Recovery Services",
  description:
    "24/7 breakdown recovery and roadside assistance across London and surrounding areas. Emergency towing, jump starts, flat tyre repair, and lockout services from £60.",
  alternates: { canonical: "/Recoveries" },
  openGraph: {
    title: "Vehicle Recovery Services",
    description:
      "24/7 breakdown recovery and roadside assistance across London. Emergency towing, jump starts, and more from £60.",
    url: "/Recoveries",
  },
};

const BreakdownRecovery = async () => {
  const businessInfo = await getBusinessInfo();
  const phone = businessInfo.phone;
  const recovery = businessInfo.recovery!;

  const recoveryServices = [
    {
      icon: Truck,
      title: "Emergency Towing",
      description:
        "Fast, safe vehicle towing to our workshop or your preferred destination. Flatbed and wheel-lift options available for all vehicle types.",
      available: "24/7",
    },
    {
      icon: Battery,
      title: "Jump Start Service",
      description:
        "Dead battery? We'll get your engine running again with our professional jump start service, plus battery testing on the spot.",
      available: "24/7",
    },
    {
      icon: CircleDot,
      title: "Flat Tyre Repair",
      description:
        "Roadside puncture repair or spare tyre fitting to get you moving. We carry a range of common tyre sizes for emergency replacements.",
      available: "24/7",
    },
    {
      icon: KeyRound,
      title: "Lockout Service",
      description:
        "Locked your keys in the car? Our trained technicians can safely gain entry without causing damage to your vehicle.",
      available: "24/7",
    },
    {
      icon: Fuel,
      title: "Fuel Delivery",
      description:
        "Run out of fuel? We'll deliver enough petrol or diesel to get you to the nearest filling station safely.",
      available: "24/7",
    },
    {
      icon: Wrench,
      title: "Roadside Diagnostics",
      description:
        "On-the-spot diagnostic scanning and minor repairs to identify issues and get you back on the road when possible.",
      available: "Daytime",
    },
  ];

  const recoveryProcess = [
    {
      step: 1,
      title: "Call Us",
      description: "Phone our 24/7 emergency line with your location and issue",
    },
    {
      step: 2,
      title: "Stay Safe",
      description:
        "Move to a safe position and turn on hazard lights while you wait",
    },
    {
      step: 3,
      title: "We Arrive",
      description:
        "Our recovery vehicle reaches you — average response time 30-45 mins",
    },
    {
      step: 4,
      title: "Diagnose & Fix",
      description:
        "We assess the issue and fix it roadside or arrange safe towing",
    },
    {
      step: 5,
      title: "Back on the Road",
      description:
        "You're either driving again or your vehicle is safely at our workshop",
    },
  ];

  const heroProps = {
    icon: Truck,
    iconBgColor: "bg-red-100 text-red-700",
    title: "Breakdown Recovery",
    description:
      "Stranded on the road? Our 24/7 breakdown recovery service gets you back on the move fast. Professional roadside assistance and vehicle recovery across London and the surrounding areas.",
    badges: [
      {
        icon: Clock,
        text: "24/7 Emergency Response",
        color: "text-red-500",
      },
      {
        icon: MapPin,
        text: "London & Surrounding Areas",
        color: "text-gray-900",
      },
      {
        icon: Shield,
        text: "Fully Insured",
        color: "text-red-700",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Vehicle Recovery Services",
          description:
            "24/7 breakdown recovery and roadside assistance across London and surrounding areas. Emergency towing, jump starts, flat tyre repair, and lockout services from £60.",
          provider: {
            "@type": "AutoDealer",
            name: businessInfo.businessName,
          },
          areaServed: { "@type": "City", name: businessInfo.city },
          priceRange: "From £60",
        }}
      />
      <ServiceHero {...heroProps} />

      {/* Emergency Call Banner */}
      <BlackRedSection className="-mt-4 mb-12">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-500/25">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Need Immediate Help?
              </h3>
              <p className="text-gray-400">
                Our recovery team is available 24 hours a day, 7 days a week.
              </p>
            </div>
          </div>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
          >
            <Phone className="h-5 w-5" />
            Call Now: {phone}
          </a>
        </div>
      </BlackRedSection>

      {/* Recovery Services Grid */}
      <div className="mb-12 md:mb-20">
        <h2 className="section-title mb-8 text-center md:mb-12">
          Our Recovery Services
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recoveryServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="group rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                    <Icon size={24} />
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {service.available}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900">
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <BlackRedSection className="mb-12">
        <ProcessFlow
          title="How Breakdown Recovery Works"
          steps={recoveryProcess}
          dark
        />
      </BlackRedSection>

      {/* Coverage Area */}
      <div className="mb-12 md:mb-20">
        <h2 className="section-title mb-4 text-center">Coverage Area</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-gray-600">
          We cover London and the surrounding counties. If you&apos;re unsure
          whether we cover your area, give us a call.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recovery &&
            recovery.coverageAreas.map((area, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                {area}
              </div>
            ))}
        </div>
      </div>

      {/* Pricing & CTA */}
      <BlackRedSection>
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Transparent Pricing
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-gray-400">
            No hidden fees. We&apos;ll give you a clear price before we start
            any work. Payment is taken on completion — no upfront charges.
          </p>

          <div className="mx-auto mb-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {recovery &&
              recovery.pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 ${
                    index === 1
                      ? "border border-red-500/30 bg-white/8 shadow-lg shadow-red-500/10"
                      : "border border-white/10 bg-white/5"
                  }`}
                >
                  <div className="mb-2 text-2xl font-bold text-red-400">
                    {tier.price}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {tier.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {tier.distance}
                  </div>
                </div>
              ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 font-semibold text-white transition-all hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
            >
              <Phone className="h-5 w-5" />
              Call For Recovery
            </a>
            <Link
              href="/Services/Repairs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white transition-all hover:bg-white/20"
            >
              <Wrench className="h-5 w-5" />
              View Repair Services
            </Link>
          </div>
        </div>
      </BlackRedSection>

      {/* FAQ */}
      <div className="mt-12 mb-8 md:mt-20">
        <h2 className="section-title mb-8 text-center md:mb-12">
          Common Questions
        </h2>
        <div className="mx-auto max-w-3xl space-y-4">
          {recovery &&
            [
              {
                q: "How quickly can you reach me?",
                a: `Our average response time is ${recovery.responseTime}. Times may vary depending on traffic and your exact location.`,
              },
              {
                q: "Do you recover all vehicle types?",
                a: "We recover cars, vans, and light commercial vehicles. For larger vehicles, please call us to discuss your requirements.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept cash, card, and bank transfer. Payment is taken upon completion of the recovery — no upfront charges.",
              },
              {
                q: "Is my vehicle insured during recovery?",
                a: "Yes, all vehicles are fully covered by our goods-in-transit insurance from the moment we take control of your vehicle.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <h3 className="mb-2 font-semibold text-gray-900">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{faq.a}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BreakdownRecovery;
