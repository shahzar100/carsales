import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, CheckCircle, Clock, Shield, ArrowRight } from "lucide-react";
import { ServiceHero, BackNavigation } from "@/components/Services/Common";
import { DetailingPackageGrid } from "@/components/Services/Detailing";
import { JsonLd } from "@/components/SEO/JsonLd";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

// Cached per-page (no longer force-dynamic via layout). Audit #1.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Car Detailing Services",
  description:
    "Premium car detailing packages from £150. Interior and exterior deep clean, paint protection, ceramic coating, and leather treatment. Book your detailing today.",
  alternates: { canonical: "/Services/Detailing" },
  openGraph: {
    title: "Car Detailing Services",
    description:
      "Premium car detailing packages from £150. Interior and exterior deep clean, paint protection, and more.",
    url: "/Services/Detailing",
  },
};

const Detailing = async () => {
  const businessInfo = await getBusinessInfo();
  const detailingPackages = businessInfo.detailingPackages!;

  const heroProps = {
    icon: Sparkles,
    iconBgColor: "bg-red-50 text-red-600",
    title: "Professional Car Detailing",
    description:
      "Transform your vehicle with our premium detailing services. Choose your package below and book today.",
    badges: [
      {
        icon: CheckCircle,
        text: "Eco-Friendly Products",
        color: "text-red-500",
      },
      { icon: Clock, text: "Same Day Service", color: "text-gray-900" },
      {
        icon: Shield,
        text: "Satisfaction Guaranteed",
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
          name: "Car Detailing Services",
          description:
            "Premium car detailing packages from £150. Interior and exterior deep clean, paint protection, ceramic coating, and leather treatment.",
          provider: {
            "@type": "AutoDealer",
            name: businessInfo.businessName,
          },
          areaServed: { "@type": "City", name: businessInfo.city },
          priceRange: "£150 – £500",
        }}
      />
      <BackNavigation href="/Services" text="Back to Services" />

      <ServiceHero {...heroProps} />

      <DetailingPackageGrid packages={detailingPackages} />

      {/* Book a Detailing Service */}
      <div id="book" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="section-title mb-2">Book Your Detailing Service</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Pick a package and a slot that suits you — most appointments
            confirmed within the hour.
          </p>
        </div>
        <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-red-600 uppercase">
                Step 1 of 5
              </p>
              <p className="text-base font-bold text-gray-900">
                Start your detailing booking
              </p>
              <p className="text-sm text-gray-600">
                No deposit · Free reschedule up to 24h
              </p>
            </div>
          </div>
          <Link
            href="/Book?service=detailing"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
          >
            Book detailing
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Detailing;
