"use client";
import React, { useState } from "react";
import { CarInterface } from "@/lib/interfaces";
import Image from "next/image";
import Link from "next/link";
import { useViewing } from "@/backend/ViewingContext";
import {
  Fuel,
  Gauge,
  Car,
  Palette,
  Calendar,
  Cog,
  DoorOpen,
  Star,
  Shield,
  CheckCircle,
  ArrowLeft,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CarDetailViewProps {
  car: CarInterface;
}

const CarDetailView: React.FC<CarDetailViewProps> = ({ car }) => {
  const { updateViewingBooking } = useViewing();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const formatMileage = (mileage: number) =>
    new Intl.NumberFormat("en-GB").format(mileage);

  // Gather all images — main + extras
  const allImages = [car.image || "/tesla.webp", ...(car.images || [])].filter(
    Boolean
  );

  const handleBookingClick = () => {
    updateViewingBooking({
      carId: car._id,
      carDetails: {
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        image: car.image,
        fuel: car.fuel,
        doors: car.doors,
        colour: car.colour,
        mileage: car.mileage,
      },
    });
  };

  const specs = [
    {
      icon: Calendar,
      label: "Year",
      value: car.year.toString(),
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      icon: Gauge,
      label: "Mileage",
      value: `${formatMileage(car.mileage)} miles`,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Fuel,
      label: "Fuel Type",
      value: car.fuel,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: Cog,
      label: "Transmission",
      value: car.transmission,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      icon: DoorOpen,
      label: "Doors",
      value: `${car.doors} doors`,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: Palette,
      label: "Colour",
      value: car.colour,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          text: "Available",
          color: "bg-emerald-500 text-white",
          dot: "bg-emerald-300",
        };
      case "reserved":
        return {
          text: "Reserved",
          color: "bg-amber-500 text-white",
          dot: "bg-amber-300",
        };
      case "sold":
        return {
          text: "Sold",
          color: "bg-red-500 text-white",
          dot: "bg-red-300",
        };
      default:
        return {
          text: status,
          color: "bg-gray-500 text-white",
          dot: "bg-gray-300",
        };
    }
  };

  const statusConfig = getStatusConfig(car.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Back Navigation */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/BrowseFleet"
            className="group flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-red-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Fleet
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${statusConfig.color}`}
            >
              <span
                className={`h-1.5 w-1.5 animate-pulse rounded-full ${statusConfig.dot}`}
              />
              {statusConfig.text}
            </span>
            {car.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Featured
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hero: Image Gallery + Key Info */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Image Gallery */}
            <div className="w-full lg:w-3/5">
              {/* Main Image */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 shadow-lg">
                <Image
                  src={allImages[activeImageIndex] || "/tesla.webp"}
                  alt={`${car.make} ${car.model}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />

                {/* Image navigation arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === 0 ? allImages.length - 1 : prev - 1
                        )
                      }
                      className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === allImages.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === activeImageIndex
                              ? "w-6 bg-white"
                              : "w-2 bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-all ${
                        idx === activeImageIndex
                          ? "ring-2 ring-red-600 ring-offset-2"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${car.make} ${car.model} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Info Panel */}
            <div className="flex w-full flex-col lg:w-2/5">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  {car.make} {car.model}
                </h1>
                <p className="mt-2 text-base text-gray-500">
                  {car.year} • {car.fuel} • {car.transmission} •{" "}
                  {formatMileage(car.mileage)} miles
                </p>
              </div>

              {/* Price Card */}
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-lg">
                <p className="mb-1 text-sm font-medium text-gray-400">
                  Our Price
                </p>
                <p className="text-4xl font-extrabold text-white">
                  {formatPrice(car.price)}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>Price includes VAT &amp; warranty</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mb-6 flex flex-col gap-3">
                <Link
                  href={`/Booking/${car._id}`}
                  onClick={handleBookingClick}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg active:scale-[0.98]"
                >
                  <Calendar className="h-5 w-5" />
                  Book a Viewing
                  <span className="ml-1 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="tel:01234567890"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
                  >
                    <Phone className="h-4 w-4 text-gray-500" />
                    Call Us
                  </a>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
                  >
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Visit Us
                  </a>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                {[
                  "Quality Inspected",
                  "No Obligation",
                  "Finance Available",
                ].map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Column: Specs + Features */}
            <div className="flex-1 space-y-8">
              {/* Specifications */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                  <Car className="h-5 w-5 text-red-600" />
                  Vehicle Specifications
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {specs.map((spec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 transition-colors hover:border-gray-200 hover:bg-gray-50/50"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${spec.bg}`}
                      >
                        <spec.icon className={`h-5 w-5 ${spec.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400">
                          {spec.label}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {spec.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
                  <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                    <Star className="h-5 w-5 text-red-600" />
                    Key Features
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {car.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3"
                      >
                        <CheckCircle className="h-4 w-4 shrink-0 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {car.description && (
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    About This Vehicle
                  </h2>
                  <p className="leading-relaxed text-gray-600">
                    {car.description}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Sidebar on Desktop */}
            <div className="hidden w-80 shrink-0 lg:block">
              <div className="sticky top-20 space-y-6">
                {/* Quick Summary */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">
                    Quick Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-sm text-gray-500">Make</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {car.make}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-sm text-gray-500">Model</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {car.model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-sm text-gray-500">Year</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {car.year}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-sm text-gray-500">Mileage</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatMileage(car.mileage)} mi
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Price</span>
                      <span className="text-lg font-extrabold text-red-600">
                        {formatPrice(car.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sticky CTA */}
                <Link
                  href={`/Booking/${car._id}`}
                  onClick={handleBookingClick}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg"
                >
                  <Calendar className="h-5 w-5" />
                  Book a Viewing
                </Link>

                {/* Guarantee Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 ring-1 ring-emerald-200/50">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-900">
                      Our Guarantee
                    </h4>
                  </div>
                  <ul className="space-y-2 text-sm text-emerald-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      Full mechanical inspection
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      Comprehensive warranty included
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      HPI checked &amp; verified
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Bottom CTA Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {car.make} {car.model}
            </p>
            <p className="text-lg font-extrabold text-red-600">
              {formatPrice(car.price)}
            </p>
          </div>
          <Link
            href={`/Booking/${car._id}`}
            onClick={handleBookingClick}
            className="shrink-0 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700"
          >
            Book Viewing
          </Link>
        </div>
      </div>

      {/* Bottom spacer for mobile CTA */}
      <div className="h-24 lg:hidden" />
    </div>
  );
};

export default CarDetailView;
