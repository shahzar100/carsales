import React from "react";
import HeroSection from "@/components/HeroSection";
import Link from "next/link";
import { Car, Calendar, Shield, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              Why Choose Our Car Viewing Service?
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              We make car buying simple, transparent, and convenient with our
              professional viewing service.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Car className="text-blue-600" size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Quality Vehicles
              </h3>
              <p className="text-gray-600">
                Hand-picked, inspected cars from trusted sources
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Calendar className="text-green-600" size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Easy Booking
              </h3>
              <p className="text-gray-600">
                Schedule viewings at your convenience, 7 days a week
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Shield className="text-purple-600" size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No Pressure
              </h3>
              <p className="text-gray-600">
                Take your time, ask questions, and make informed decisions
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <Award className="text-yellow-600" size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Expert Advice
              </h3>
              <p className="text-gray-600">
                Knowledgeable staff to help you find the perfect match
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-20 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
            Ready to Find Your Next Car?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-300">
            Browse our extensive collection or book a viewing appointment today.
            Our team is here to help you every step of the way.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/BrowseFleet"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Car size={24} />
              View All Cars
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
