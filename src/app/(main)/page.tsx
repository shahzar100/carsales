import React from "react";
import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import Link from "next/link";
import { Car, Calendar, Shield, Award } from "lucide-react";
import { BlackRedSection } from "@/components/Services/Common";
import { JsonLd } from "@/components/SEO/JsonLd";

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "MMC Leeds";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: `${businessName} — Car Sales & Services`,
  description:
    "Browse quality vehicles, book car viewings, and access professional auto services including detailing, tinting, repairs, and breakdown recovery.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${businessName} — Car Sales & Services`,
    description:
      "Browse quality vehicles, book car viewings, and access professional auto services.",
    url: "/",
  },
};

export default function Home() {
  const autoDealer = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: businessName,
    url: siteUrl,
    description:
      "Quality car sales, vehicle viewings, and professional auto services including detailing, window tinting, repairs, and breakdown recovery.",
    currenciesAccepted: "GBP",
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Car Sales" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Car Detailing" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Window Tinting" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Auto Repairs" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Breakdown Recovery" },
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={autoDealer} />
      <HeroSection />

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="section-title mb-4">
              Why Choose Our Car Viewing Service?
            </h2>
            <p className="description mx-auto max-w-2xl">
              We make car buying simple, transparent, and convenient with our
              professional viewing service.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Car className="text-red-600" size={32} />
              </div>
              <h3 className="heading-4 mb-2">Quality Vehicles</h3>
              <p className="text-gray-600">
                Hand-picked, inspected cars from trusted sources
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <Calendar className="text-red-500" size={32} />
              </div>
              <h3 className="heading-4 mb-2">Easy Booking</h3>
              <p className="text-gray-600">
                Schedule viewings at your convenience, 7 days a week
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <Shield className="text-red-500" size={32} />
              </div>
              <h3 className="heading-4 mb-2">No Pressure</h3>
              <p className="text-gray-600">
                Take your time, ask questions, and make informed decisions
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Award className="text-red-600" size={32} />
              </div>
              <h3 className="heading-4 mb-2">Expert Advice</h3>
              <p className="text-gray-600">
                Knowledgeable staff to help you find the perfect match
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <BlackRedSection>
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Ready to Find Your Next Car?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
              Browse our extensive collection or book a viewing appointment
              today. Our team is here to help you every step of the way.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/BrowseFleet"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-8 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:-translate-y-1 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/30"
              >
                <Car size={24} />
                View All Cars
              </Link>
            </div>
          </div>
        </BlackRedSection>
      </section>
    </div>
  );
}
