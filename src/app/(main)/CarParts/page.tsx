import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Cog, CheckCircle, Clock, Shield } from "lucide-react";
import CarPartsGrid from "@/components/CarParts/CarPartsGrid";
import { BlackRedSection, ServiceHero } from "@/components/Services/Common";
import { CarPartInterface } from "@/lib/interfaces";
import { getCarPartsCollection, serializeDocument } from "@/lib/models";

export const metadata: Metadata = {
  title: "Car Parts & Accessories",
  description:
    "Browse quality car parts and accessories from top brands. New, used, and refurbished parts available. Reserve online and get expert installation at our location.",
  alternates: { canonical: "/CarParts" },
  openGraph: {
    title: "Car Parts & Accessories",
    description:
      "Browse quality car parts and accessories from top brands. Reserve online and get expert installation.",
    url: "/CarParts",
  },
};

const Page = async () => {
  const getCarParts = async (): Promise<CarPartInterface[]> => {
    const carPartsCollection = await getCarPartsCollection();
    const parts = await carPartsCollection.find({}).toArray();
    return parts.map((part) => serializeDocument(part));
  };

  const parts = await getCarParts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ServiceHero
        icon={Cog}
        iconBgColor="bg-red-50 text-red-600"
        title="Car Parts & Components"
        description="Browse our extensive collection of quality car parts. Reserve your parts today and complete your purchase at our location with expert installation available."
        badges={[
          {
            icon: CheckCircle,
            text: "Quality Assured",
            color: "text-red-500",
          },
          { icon: Clock, text: "Fast Availability", color: "text-gray-900" },
          {
            icon: Shield,
            text: "Expert Installation",
            color: "text-red-700",
          },
        ]}
      />

      {/* Car Parts Grid with Integrated Filters */}
      <CarPartsGrid parts={parts} />

      {/* Bottom Info Section */}
      <BlackRedSection className="mt-8 md:mt-16">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            How Part Reservation Works
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-500/20">
                1
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Reserve Online
              </h3>
              <p className="text-sm text-gray-400">
                Browse and reserve the parts you need from our online catalog.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-500/20">
                2
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Visit Our Location
              </h3>
              <p className="text-sm text-gray-400">
                Come to our shop to inspect and complete your purchase.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-500/20">
                3
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Expert Installation
              </h3>
              <p className="text-sm text-gray-400">
                Get professional installation services from our certified
                mechanics.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
            >
              Contact Us for More Info
            </Link>
          </div>
        </div>
      </BlackRedSection>
    </div>
  );
};

export default Page;
