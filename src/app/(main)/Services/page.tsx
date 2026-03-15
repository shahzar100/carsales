import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CheckCircle, Star, Shield, Wrench } from "lucide-react";
import {
  PackageGrid,
  PackageCard,
  FeatureList,
  InfoBox,
  BlackRedSection,
  ServiceHero,
} from "@/components/Services/Common";
import type { AccentColor } from "@/components/Services/Common/PackageCard";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Professional auto services including car detailing, window tinting, and expert repairs. Certified technicians, same day service, and satisfaction guaranteed.",
  alternates: { canonical: "/Services" },
  openGraph: {
    title: "Our Services",
    description:
      "Professional auto services including car detailing, window tinting, and expert repairs.",
    url: "/Services",
  },
};

const serviceRoutes: Record<string, { href: string; accent: AccentColor }> = {
  detailing: { href: "/Services/Detailing", accent: "red" },
  tints: { href: "/Services/Tints", accent: "crimson" },
  repairs: { href: "/Services/Repairs", accent: "dark" },
};

const Services = async () => {
  const businessInfo = await getBusinessInfo();
  const mainServices = (businessInfo.serviceOverviews ?? []).map((svc) => ({
    ...svc,
    href: serviceRoutes[svc.id]?.href ?? "/Services",
    accent: serviceRoutes[svc.id]?.accent ?? ("red" as AccentColor),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ServiceHero
        icon={Wrench}
        iconBgColor="bg-red-50 text-red-600"
        title="Professional Auto Services"
        description="From premium detailing to expert repairs, we provide comprehensive automotive services to keep your vehicle in peak condition. All services backed by our satisfaction guarantee."
        badges={[
          {
            icon: CheckCircle,
            text: "Certified Technicians",
            color: "text-red-500",
          },
          { icon: Clock, text: "Same Day Service", color: "text-gray-900" },
          { icon: Star, text: "5-Star Rated", color: "text-red-700" },
        ]}
      />

      {/* Services Grid */}
      <PackageGrid title="Our Services">
        {mainServices.map((service) => (
          <PackageCard
            key={service.id}
            name={service.title}
            subtitle={service.subtitle}
            price={service.priceRange}
            extra={service.duration}
            accent={service.accent}
            footer={
              <Link
                href={service.href}
                className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold tracking-wide text-white transition-all duration-200 ${
                  service.accent === "red"
                    ? "bg-red-600 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
                    : service.accent === "crimson"
                      ? "bg-red-700 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25"
                      : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Learn More & Book
              </Link>
            }
          >
            <div className="space-y-3">
              <FeatureList
                features={service.features}
                accent={service.accent}
              />
              <InfoBox
                rows={[
                  { label: "Price Range:", value: service.priceRange },
                  { label: "Duration:", value: service.duration },
                ]}
              />
            </div>
          </PackageCard>
        ))}
      </PackageGrid>

      {/* Why Choose Us */}
      <div className="mt-8 mb-12 md:mt-16">
        <div className="text-center">
          <div className="mb-12 text-center">
            <h2 className="section-title mb-4">Why Choose Our Services?</h2>
            <p className="description mx-auto max-w-2xl text-gray-600">
              We combine years of experience with state-of-the-art equipment to
              deliver exceptional results that exceed your expectations.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                <CheckCircle size={24} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Quality Guarantee
              </h3>
              <p className="text-sm text-gray-600">
                100% satisfaction guaranteed on all services
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                <Clock size={24} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Fast Turnaround
              </h3>
              <p className="text-sm text-gray-600">
                Quick and efficient service without compromising quality
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                <Star size={24} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Expert Team
              </h3>
              <p className="text-sm text-gray-600">
                Certified professionals with years of experience
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                <Shield size={24} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Fully Insured
              </h3>
              <p className="text-sm text-gray-600">
                Complete coverage for your peace of mind
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Book a Service */}
      <BlackRedSection>
        <div id="book" className="scroll-mt-8">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Book a Service
            </h2>
            <p className="mx-auto max-w-2xl text-gray-400">
              Ready to get started? Fill in the form below to schedule your
              appointment.
            </p>
          </div>
          <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <ServiceBookingForm />
          </div>
        </div>
      </BlackRedSection>
    </div>
  );
};

export default Services;
