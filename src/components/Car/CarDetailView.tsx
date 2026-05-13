"use client";
import React, { useState, useEffect } from "react";
import { CarInterface } from "@/lib/interfaces";
import Image from "next/image";
import Link from "next/link";
import { useViewing } from "@/contexts/ViewingContext";
import { useBusinessInfo } from "@/contexts/BusinessInfoContext";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import {
  Fuel,
  Gauge,
  Palette,
  Calendar,
  Cog,
  DoorOpen,
  ShieldCheck,
  BadgeCheck,
  Wrench,
  KeyRound,
  Heart,
  Share2,
  Maximize2,
  Camera,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
  Map as MapIcon,
  Tag,
  CalendarCheck,
  Check,
  Clock,
  Mail,
} from "lucide-react";
import { CarShareModal } from "@/components/SEO/CarShareCard";
import { formatPrice, formatMileage } from "@/lib/utils/format";
import FinanceCalculator from "@/components/Car/FinanceCalculator";
import ReserveCarForm from "@/components/Car/ReserveCarForm";
import PartExchangeForm from "@/components/Car/PartExchangeForm";

interface CarDetailViewProps {
  car: CarInterface;
  similar?: CarInterface[];
}

const FALLBACK_IMAGE = "/tesla.webp";

// Trust band — generic dealer promises that don't depend on per-car data.
const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "HPI clear" },
  { icon: BadgeCheck, label: "6-month warranty" },
  { icon: Wrench, label: "AA pre-sale inspection" },
  { icon: KeyRound, label: "2 keys · handbook pack" },
] as const;

const CarDetailView: React.FC<CarDetailViewProps> = ({ car, similar = [] }) => {
  const { businessInfo } = useBusinessInfo();
  const phone = businessInfo?.phone ?? "0113 252 6041";
  const mapsUrl = businessInfo?.googleMapsUrl;
  const dealerName = businessInfo?.businessName ?? "Morley Showroom";
  const dealerAddress = businessInfo?.address;
  const dealerCity = businessInfo?.city;
  const dealerZip = businessInfo?.zipCode;
  const { updateViewingBooking } = useViewing();
  const { isSaved, toggle } = useSavedCars();
  const carIdStr = car._id ? String(car._id) : "";
  const saved = carIdStr ? isSaved(carIdStr) : false;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const allImages = [car.image || FALLBACK_IMAGE, ...(car.images || [])].filter(
    Boolean
  );
  const totalImages = allImages.length;

  const handleBookingClick = () => {
    updateViewingBooking({
      carId: car._id ? String(car._id) : undefined,
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

  const carTitle = `${car.year} ${car.make} ${car.model}`;

  const secondarySpecs = [
    { icon: Fuel, label: "Fuel", value: car.fuel },
    { icon: Cog, label: "Transmission", value: car.transmission },
    { icon: DoorOpen, label: "Doors / seats", value: `${car.doors} dr · 5 st` },
    { icon: Palette, label: "Colour", value: car.colour },
  ];

  // Mobile sticky bar reveals after the user scrolls past the price block.
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-700">
      {/* ── Breadcrumb strip ─────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500"
          >
            <Link href="/BrowseFleet" className="hover:text-red-600">
              Browse Fleet
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden="true" />
            <span>{car.fuel}</span>
            <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden="true" />
            <span>{car.make}</span>
            <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden="true" />
            <span className="font-semibold text-gray-900">{car.model}</span>
          </nav>
          <Link
            href="/BrowseFleet"
            className="hidden items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 sm:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to results
          </Link>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-7 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_408px] lg:items-start">
            {/* ── LEFT column ──────────────────────────────────── */}
            <div className="flex min-w-0 flex-col gap-7">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.06em] text-red-600 uppercase">
                    <span>{car.year}</span>
                    <span className="h-1 w-1 rounded-full bg-red-300" />
                    <span>{car.fuel}</span>
                    <span className="h-1 w-1 rounded-full bg-red-300" />
                    <span>{car.transmission}</span>
                  </div>
                  {car.status !== "available" && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                        car.status === "reserved"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {car.status === "reserved" ? "Reserved" : "Sold"}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[40px] sm:leading-[1.05]">
                  {car.make} {car.model}
                </h1>
                <p className="text-base font-medium text-gray-500">
                  {formatMileage(car.mileage)} miles · {car.colour}
                </p>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin
                    className="h-3.5 w-3.5 text-gray-400"
                    aria-hidden="true"
                  />
                  {dealerName}
                  {dealerCity ? `, ${dealerCity}` : ""}
                </div>
              </div>

              {/* Gallery */}
              <div className="w-full">
                <div
                  role="region"
                  aria-label={`${carTitle} image gallery`}
                  tabIndex={totalImages > 1 ? 0 : -1}
                  onKeyDown={(e) => {
                    if (totalImages <= 1) return;
                    if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      setActiveImageIndex(
                        (prev) => (prev - 1 + totalImages) % totalImages
                      );
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      setActiveImageIndex((prev) => (prev + 1) % totalImages);
                    }
                  }}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950 sm:aspect-[16/10] sm:rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <Image
                    src={allImages[activeImageIndex] || FALLBACK_IMAGE}
                    alt={carTitle}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />

                  {/* Bottom + top gradient for control legibility */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.20) 100%)",
                    }}
                  />

                  {totalImages > 1 && (
                    <span className="sr-only" aria-live="polite">
                      Image {activeImageIndex + 1} of {totalImages}
                    </span>
                  )}

                  {/* Top-left: counter pill */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white tabular-nums">
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                    {activeImageIndex + 1} / {totalImages}
                  </div>

                  {/* Top-right: save + share */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {carIdStr && (
                      <button
                        type="button"
                        onClick={() => toggle(carIdStr)}
                        aria-pressed={saved}
                        aria-label={saved ? "Remove from saved" : "Save"}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
                      >
                        <Heart
                          className={`h-5 w-5 ${saved ? "fill-red-500 text-red-500" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                    <CarShareModal
                      car={car}
                      trigger={
                        <button
                          type="button"
                          aria-label="Share this listing"
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
                        >
                          <Share2 className="h-[18px] w-[18px]" />
                        </button>
                      }
                    />
                  </div>

                  {/* Bottom-right: fullscreen */}
                  <div className="absolute right-3 bottom-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3 text-xs font-semibold text-white">
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Fullscreen
                  </div>

                  {/* Prev/Next — desktop only */}
                  {totalImages > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={() =>
                          setActiveImageIndex(
                            (prev) => (prev - 1 + totalImages) % totalImages
                          )
                        }
                        className="absolute top-1/2 left-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 sm:flex"
                      >
                        <ChevronLeft className="h-[22px] w-[22px]" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev + 1) % totalImages)
                        }
                        className="absolute top-1/2 right-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 sm:flex"
                      >
                        <ChevronRight className="h-[22px] w-[22px]" />
                      </button>
                    </>
                  )}

                  {/* Mobile: swipe-hint dots */}
                  {totalImages > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
                      {allImages.slice(0, 8).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            i === Math.min(activeImageIndex, 7)
                              ? "bg-white"
                              : "bg-white/45"
                          }`}
                        />
                      ))}
                      {totalImages > 8 && (
                        <span className="ml-1 text-[10px] font-semibold text-white/80 tabular-nums">
                          +{totalImages - 8}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {totalImages > 1 && (
                  <div
                    className="mt-3 flex gap-2 overflow-x-auto pb-1 px-4 sm:px-0"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIndex(i)}
                        aria-label={`Show image ${i + 1}`}
                        aria-current={
                          i === activeImageIndex ? "true" : undefined
                        }
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-[84px] sm:w-[84px] ${
                          i === activeImageIndex
                            ? "ring-2 ring-red-600"
                            : "ring-1 ring-gray-200 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${carTitle} thumbnail ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="84px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary specs */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                    <Gauge className="h-3 w-3" />
                    Mileage
                  </div>
                  <div className="text-[26px] leading-none font-bold tracking-tight text-gray-900 tabular-nums">
                    {formatMileage(car.mileage)}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500">
                    miles on the clock
                  </div>
                </div>
                <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                    <Calendar className="h-3 w-3" />
                    Registered
                  </div>
                  <div className="text-[26px] leading-none font-bold tracking-tight text-gray-900 tabular-nums">
                    {car.year}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500">
                    {car.fuel} · {car.transmission}
                  </div>
                </div>
                <div className="hidden flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 sm:flex">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                    <Palette className="h-3 w-3" />
                    Colour
                  </div>
                  <div className="text-[26px] leading-none font-bold tracking-tight text-gray-900">
                    {car.colour}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-500">
                    {car.doors} doors
                  </div>
                </div>
              </div>

              {/* Secondary specs */}
              <div>
                <div className="mb-2.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  Detailed specs
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
                    {secondarySpecs.map((s) => (
                      <div
                        key={s.label}
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600">
                          <s.icon className="h-[15px] w-[15px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                            {s.label}
                          </div>
                          <div className="truncate text-[13px] font-semibold text-gray-900">
                            {s.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-bold tracking-tight text-gray-900">
                    What&apos;s included
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {car.features.slice(0, 8).map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 text-xs font-medium text-gray-700"
                      >
                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-red-600"
                          aria-hidden="true"
                        />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                  {car.features.length > 8 && (
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                      See all {car.features.length} features
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {car.description && (
                <div className="flex flex-col gap-3 border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-bold tracking-tight text-gray-900">
                    About this car
                  </h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
                    {car.description}
                  </p>
                </div>
              )}
            </div>

            {/* ── RIGHT column (sticky CTA card) ───────────────── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.08)]">
                {/* Price block */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-[40px] font-extrabold leading-none tracking-tight text-gray-900 tabular-nums sm:text-5xl">
                      {formatPrice(car.price)}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700">
                      Drive away price
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Tag
                      className="h-3.5 w-3.5 text-gray-400"
                      aria-hidden="true"
                    />
                    Inc. VAT · road tax · 12-month MOT
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* CTA stack */}
                <div className="flex flex-col gap-2.5">
                  <Link
                    href={`/Booking/${car._id}`}
                    onClick={handleBookingClick}
                    className="group flex items-center gap-3.5 rounded-xl bg-red-600 p-4 text-left text-white shadow-[0_10px_20px_-8px_rgba(220,38,38,0.45)] transition-all hover:-translate-y-0.5 hover:bg-red-700"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/20">
                      <CalendarCheck
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex-1">
                      <span className="block text-base font-bold tracking-tight sm:text-[17px]">
                        Book a viewing
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-white/85">
                        Free · no deposit · pick a time today
                      </span>
                    </span>
                    <ArrowRight
                      className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>

                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="flex min-h-[96px] flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-red-600 hover:bg-red-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <Phone className="h-4 w-4" />
                      </span>
                      <span className="mt-0.5 text-sm font-bold text-gray-900">
                        Call dealer
                      </span>
                      <span className="text-[11px] font-medium leading-snug text-gray-500">
                        {phone} · open until 7pm
                      </span>
                    </a>
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[96px] flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-red-600 hover:bg-red-50"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <MapIcon className="h-4 w-4" />
                        </span>
                        <span className="mt-0.5 text-sm font-bold text-gray-900">
                          Get directions
                        </span>
                        <span className="text-[11px] font-medium leading-snug text-gray-500">
                          {dealerCity || "Visit our showroom"}
                        </span>
                      </a>
                    ) : (
                      <a
                        href={`mailto:${businessInfo?.email ?? ""}`}
                        className="flex min-h-[96px] flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-red-600 hover:bg-red-50"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <Mail className="h-4 w-4" />
                        </span>
                        <span className="mt-0.5 text-sm font-bold text-gray-900">
                          Send enquiry
                        </span>
                        <span className="text-[11px] font-medium leading-snug text-gray-500">
                          Reply usually within an hour
                        </span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Trust band */}
                <div className="grid grid-cols-2 gap-1.5">
                  {TRUST_ITEMS.map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center gap-2 rounded-[10px] border border-gray-100 bg-white px-2.5 py-2"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
                        <t.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[11px] font-semibold leading-tight text-gray-700">
                        {t.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dealer card */}
              <div className="relative flex flex-col gap-3.5 overflow-hidden rounded-2xl bg-neutral-950 p-5 text-white">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full"
                  style={{
                    background: "rgba(220,38,38,0.20)",
                    filter: "blur(60px)",
                  }}
                />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
                    <Image
                      src="/logo.jpeg"
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-red-400 uppercase">
                      View this car
                    </div>
                    <div className="mt-0.5 text-base font-bold">
                      {dealerName}
                      {dealerCity ? `, ${dealerCity}` : ""}
                    </div>
                  </div>
                </div>
                <div className="relative grid grid-cols-2 gap-2.5 text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="h-3.5 w-3.5 shrink-0 text-red-400"
                      aria-hidden="true"
                    />
                    <div className="text-xs">
                      {dealerAddress || "12 Bridge St"}
                      <br />
                      {dealerCity || "Morley"}{" "}
                      {dealerZip || "LS27 9AB"}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-red-400"
                      aria-hidden="true"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-emerald-400">
                        Open now
                      </span>
                      <br />
                      Closes 7pm · 7 days a week
                    </div>
                  </div>
                </div>
                <div className="relative flex gap-2">
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {phone}
                  </a>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                    >
                      <MapIcon className="h-3.5 w-3.5" />
                      Get directions
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Similar cars rail ─────────────────────────────── */}
          {similar.length > 0 && (
            <div className="mt-12 border-t border-gray-100 pt-8">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-xl font-extrabold tracking-tight text-red-600 sm:text-2xl">
                  Similar to this
                </h2>
                <Link
                  href="/BrowseFleet"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                >
                  See all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div
                className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
                style={{ scrollbarWidth: "none" }}
              >
                {similar.slice(0, 4).map((s) => (
                  <Link
                    key={String(s._id)}
                    href={`/BrowseFleet/${s._id}`}
                    className="group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_10px_25px_-8px_rgba(0,0,0,0.15)] sm:w-auto"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-950">
                      <Image
                        src={s.image || FALLBACK_IMAGE}
                        alt={`${s.make} ${s.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 260px, 25vw"
                      />
                      {s.featured && (
                        <span className="absolute top-2 left-2 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 p-3">
                      <div className="text-sm font-bold leading-tight text-gray-900">
                        {s.make} {s.model}
                      </div>
                      <div className="flex gap-1.5 text-[11px] text-gray-500">
                        <span>{s.year}</span>
                        <span className="text-gray-300">·</span>
                        <span>{formatMileage(s.mileage)} mi</span>
                        <span className="text-gray-300">·</span>
                        <span>{s.fuel}</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <div className="text-[17px] font-extrabold text-gray-900 tabular-nums">
                          {formatPrice(s.price)}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide text-red-600 uppercase">
                          <ArrowRight className="h-3 w-3" />
                          View
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stock ref footer line */}
          {car._id && (
            <div className="mt-8 border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
              Stock ref: MMC-{String(car._id).slice(-6).toUpperCase()}
            </div>
          )}
        </div>
      </section>

      {/* ── Finance / Reserve / Part-exchange — kept below the design-led
          content. These are real, production features (#29/#30/#31) and
          are not part of the new visual design but remain useful here. */}
      {car.status === "available" && (
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <FinanceCalculator price={car.price} />
            {car._id && (
              <ReserveCarForm
                carId={String(car._id)}
                carLabel={carTitle}
              />
            )}
            {car._id && (
              <PartExchangeForm
                carId={String(car._id)}
                carLabel={carTitle}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Mobile sticky bar ─────────────────────────────────── */}
      <div
        aria-hidden={!stickyVisible}
        className={`fixed right-0 bottom-0 left-0 z-40 flex items-center gap-3 border-t border-gray-200 bg-white p-3 shadow-[0_-10px_25px_-10px_rgba(0,0,0,0.15)] transition-transform duration-300 lg:hidden ${
          stickyVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex min-w-0 shrink-0 flex-col">
          <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            {car.make} {car.model}
          </div>
          <div className="text-xl font-extrabold leading-none tracking-tight text-gray-900 tabular-nums">
            {formatPrice(car.price)}
          </div>
          <div className="mt-0.5 text-[10px] font-bold tracking-wide text-emerald-600 uppercase">
            Drive away
          </div>
        </div>
        <Link
          href={`/Booking/${car._id}`}
          onClick={handleBookingClick}
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-red-600 px-3 py-3.5 text-[15px] font-bold tracking-tight text-white shadow-[0_8px_16px_-6px_rgba(220,38,38,0.45)]"
        >
          <CalendarCheck className="h-[18px] w-[18px]" />
          Book viewing
        </Link>
      </div>

      {/* Spacer for sticky bar */}
      {stickyVisible && <div className="h-24 lg:hidden" aria-hidden="true" />}
    </div>
  );
};

export default CarDetailView;
