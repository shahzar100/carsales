import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Car,
  Wrench,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Users,
  Award,
  CheckCircle,
  Sparkles,
  Eye,
  Calendar,
  Truck,
  Heart,
} from "lucide-react";
import { BlackRedSection, ProcessFlow } from "@/components/Services/Common";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { getCarsCollection } from "@/lib/models";
import { JsonLd } from "@/components/SEO/JsonLd";

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

// Cached per-page (no longer force-dynamic via layout). Audit #1.
export const revalidate = 3600;

const dayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const processSteps = [
  {
    step: 1,
    title: "Browse Online",
    description: "Explore our curated collection of quality vehicles online",
  },
  {
    step: 2,
    title: "Book a Viewing",
    description: "Schedule a convenient time to see the car in person",
  },
  {
    step: 3,
    title: "Expert Guidance",
    description: "Our knowledgeable team helps you find your ideal match",
  },
  {
    step: 4,
    title: "Test Drive",
    description: "Take the car for a spin and feel the difference",
  },
  {
    step: 5,
    title: "Drive Home Happy",
    description: "Simple paperwork, fair pricing, and you're on the road",
  },
];

export const metadata: Metadata = {
  title: `About Us — ${businessName}`,
  description:
    "Learn about our story, our services, and why thousands of customers trust us for quality vehicles, professional detailing, window tinting, expert repairs, and 24/7 breakdown recovery.",
  alternates: { canonical: "/AboutUs" },
  openGraph: {
    title: `About Us — ${businessName}`,
    description:
      "Your trusted partner for quality vehicles and professional automotive services.",
    url: "/AboutUs",
  },
};

export default async function AboutUs() {
  const [businessInfo, carsCollection] = await Promise.all([
    getBusinessInfo(),
    getCarsCollection(),
  ]);

  const [availableCars, soldCars, makes] = await Promise.all([
    carsCollection.countDocuments({ status: "available" }),
    carsCollection.countDocuments({ status: "sold" }),
    carsCollection.distinct("make", { status: "available" }),
  ]);

  const name = businessInfo.businessName;
  const phone = businessInfo.phone;
  const email = businessInfo.email;
  const address = businessInfo.address;
  const city = businessInfo.city;
  const hours = businessInfo.hours;
  const description = businessInfo.description;
  const heroStats = businessInfo.heroStats;
  const services = businessInfo.serviceOverviews ?? [];
  const recovery = businessInfo.recovery;
  const social = businessInfo.socialMedia;
  const googleMapsUrl = businessInfo.googleMapsUrl;

  const fullAddress =
    `${address}, ${city}${businessInfo.state ? `, ${businessInfo.state}` : ""} ${businessInfo.zipCode}`.trim();

  // Organization / LocalBusiness structured data, built from the same
  // business info the page already renders.
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    name,
    description:
      description ||
      "Your trusted partner for quality vehicles and professional automotive services.",
    telephone: phone,
    email,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: city,
      addressRegion: businessInfo.state,
      postalCode: businessInfo.zipCode,
      addressCountry: "GB",
    },
    ...(googleMapsUrl ? { hasMap: googleMapsUrl } : {}),
    ...(social
      ? {
          sameAs: [
            social.facebook,
            social.twitter,
            social.instagram,
            social.tiktok,
          ].filter(Boolean),
        }
      : {}),
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={orgJsonLd} />

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute -top-32 right-0 h-125 w-125 rounded-full bg-red-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-red-600/3 blur-3xl" />

        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
              <Heart size={14} className="fill-red-400" />
              Trusted by Hundreds of Happy Customers
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
              About{" "}
              <span className="bg-linear-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                {name}
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              {description ||
                "Your trusted partner for quality vehicles and professional automotive services."}
            </p>

            {/* Hero Stats — only render stats that look impressive */}
            {(() => {
              const stats = [
                availableCars >= 3 && {
                  value: `${availableCars}+`,
                  label: "Cars In Stock",
                },
                soldCars >= 5 && { value: `${soldCars}+`, label: "Cars Sold" },
                makes.length >= 3 && {
                  value: `${makes.length}+`,
                  label: "Brands Available",
                },
                heroStats?.rating?.value && {
                  value: heroStats.rating.value,
                  label: heroStats.rating.label || "Customer Rating",
                },
              ].filter(Boolean) as { value: string; label: string }[];

              if (stats.length === 0) return null;

              const colClass =
                stats.length === 1
                  ? "grid-cols-1 max-w-xs"
                  : stats.length === 2
                    ? "grid-cols-2 max-w-lg"
                    : stats.length === 3
                      ? "grid-cols-3 max-w-2xl"
                      : "grid-cols-2 sm:grid-cols-4 max-w-3xl";

              return (
                <div className={`mx-auto grid gap-6 ${colClass}`}>
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm"
                    >
                      <p className="text-2xl font-bold text-red-500 sm:text-3xl">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ─── Our Story ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left — Content */}
              <div>
                <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                  Our Story
                </p>
                <h2 className="section-title mb-6 text-gray-900!">
                  Built on Passion, Driven by Trust
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    {name} was founded with one simple belief: buying a car
                    should be an exciting and transparent experience, not a
                    stressful one. Every vehicle in our collection is
                    hand-picked, thoroughly inspected, and priced fairly — so
                    you can browse with confidence.
                  </p>
                  <p>
                    Over the years we&apos;ve grown from a small local
                    dealership into a full-service automotive destination. Today
                    we offer premium car detailing, professional window tinting,
                    expert repairs, and 24/7 breakdown recovery — all under one
                    roof.
                  </p>
                  <p>
                    Our team is made up of car enthusiasts who genuinely care
                    about matching you with the right vehicle. Whether
                    you&apos;re a first-time buyer or a seasoned collector, we
                    treat every customer like family.
                  </p>
                </div>
              </div>

              {/* Right — Values Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Eye size={24} />
                  </div>
                  <h3 className="heading-4 mb-1">Transparency</h3>
                  <p className="text-sm text-gray-600">
                    Honest pricing, full vehicle history, no hidden fees.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Award size={24} />
                  </div>
                  <h3 className="heading-4 mb-1">Quality</h3>
                  <p className="text-sm text-gray-600">
                    Every car is inspected, serviced, and prepared to the
                    highest standard.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Users size={24} />
                  </div>
                  <h3 className="heading-4 mb-1">Customer First</h3>
                  <p className="text-sm text-gray-600">
                    Your satisfaction is our priority, before and after the
                    sale.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Heart size={24} />
                  </div>
                  <h3 className="heading-4 mb-1">Passion</h3>
                  <p className="text-sm text-gray-600">
                    We love cars and it shows in everything we do.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <BlackRedSection>
        <ProcessFlow title="How It Works" steps={processSteps} dark={true} />
      </BlackRedSection>

      {/* ─── Our Services Overview ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                What We Offer
              </p>
              <h2 className="section-title mb-4 text-gray-900!">
                Complete Automotive Services
              </h2>
              <p className="description mx-auto max-w-2xl">
                From finding your next car to keeping it in peak condition,
                we&apos;ve got you covered with a full range of professional
                services.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Car Sales Card */}
              <Link
                href="/BrowseFleet"
                className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                  <Car size={28} />
                </div>
                <h3 className="heading-3 mb-2">Car Sales</h3>
                <p className="mb-4 text-sm text-gray-600">
                  {availableCars >= 3 && makes.length >= 3
                    ? `Browse ${availableCars}+ quality vehicles across ${makes.length} brands. Hand-picked, inspected, and ready to drive.`
                    : "Quality vehicles, hand-picked, inspected, and ready to drive."}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-red-600 transition-colors group-hover:text-red-500">
                  Browse Fleet
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>

              {/* Dynamic Service Cards */}
              {services.map((service) => {
                const serviceRoutes: Record<string, string> = {
                  detailing: "/Services/Detailing",
                  tints: "/Services/Tints",
                  repairs: "/Services/Repairs",
                };
                const serviceIcons: Record<string, React.ReactNode> = {
                  detailing: <Sparkles size={28} />,
                  tints: <Shield size={28} />,
                  repairs: <Wrench size={28} />,
                };
                const href = serviceRoutes[service.id] ?? "/Services";
                const icon = serviceIcons[service.id] ?? <Wrench size={28} />;

                return (
                  <Link
                    key={service.id}
                    href={href}
                    className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/5"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                      {icon}
                    </div>
                    <h3 className="heading-3 mb-2">{service.title}</h3>
                    <p className="mb-1 text-sm text-gray-600">
                      {service.subtitle}
                    </p>
                    <p className="mb-4 text-sm text-gray-500">
                      {service.priceRange} · {service.duration}
                    </p>
                    <ul className="mb-4 space-y-1.5">
                      {service.features.slice(0, 3).map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle
                            size={14}
                            className="shrink-0 text-red-500"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <span className="inline-flex items-center text-sm font-medium text-red-600 transition-colors group-hover:text-red-500">
                      Learn More
                      <svg
                        className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </Link>
                );
              })}

              {/* Recovery Card */}
              {recovery && (
                <Link
                  href="/Recoveries"
                  className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/5"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                    <Truck size={28} />
                  </div>
                  <h3 className="heading-3 mb-2">Breakdown Recovery</h3>
                  <p className="mb-1 text-sm text-gray-600">
                    24/7 emergency roadside assistance
                  </p>
                  <p className="mb-4 text-sm text-gray-500">
                    {recovery.pricingTiers?.[0]?.price} ·{" "}
                    {recovery.responseTime}
                  </p>
                  <ul className="mb-4 space-y-1.5">
                    {recovery.coverageAreas?.slice(0, 3).map((area) => (
                      <li
                        key={area}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <MapPin size={14} className="shrink-0 text-red-500" />
                        {area}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center text-sm font-medium text-red-600 transition-colors group-hover:text-red-500">
                    Learn More
                    <svg
                      className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ─── */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                The {name} Difference
              </p>
              <h2 className="section-title mb-4 text-gray-900!">
                Why Customers Trust Us
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
                  <Car className="text-red-600" size={28} />
                </div>
                <h3 className="heading-4 mb-2">Hand-Picked Vehicles</h3>
                <p className="text-sm text-gray-600">
                  Every car is sourced from trusted channels, fully inspected,
                  and HPI checked before it reaches our forecourt.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
                  <Calendar className="text-red-600" size={28} />
                </div>
                <h3 className="heading-4 mb-2">Flexible Viewings</h3>
                <p className="text-sm text-gray-600">
                  Book viewings online at your convenience — evenings and
                  weekends available. No pressure, no rush.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
                  <Shield className="text-red-600" size={28} />
                </div>
                <h3 className="heading-4 mb-2">Full Service Centre</h3>
                <p className="text-sm text-gray-600">
                  Detailing, tinting, repairs, and recovery — everything your
                  car needs in one place, by certified technicians.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
                  <Star className="text-red-600" size={28} />
                </div>
                <h3 className="heading-4 mb-2">
                  {heroStats?.rating?.value || "4.9"}-Star Rated
                </h3>
                <p className="text-sm text-gray-600">
                  Our customers love us. Read the reviews and see why we&apos;re
                  one of the most trusted names in automotive services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Brands We Carry ─── */}
      {makes.length > 0 && (
        <section className="bg-white py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 text-center">
                <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                  Our Fleet
                </p>
                <h2 className="section-title mb-4 text-gray-900!">
                  Brands We Carry
                </h2>
                <p className="description mx-auto max-w-xl">
                  Explore vehicles from {makes.length} leading manufacturers —
                  all available to view and test drive.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {makes.sort().map((make) => (
                  <Link
                    key={make}
                    href={`/BrowseFleet/${make}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    {make}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Opening Hours & Contact ─── */}
      <BlackRedSection>
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold tracking-widest text-red-400 uppercase">
              Visit Us
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Opening Hours & Contact
            </h2>
            <p className="mx-auto max-w-xl text-gray-400">
              Pop in during opening hours or get in touch — we&apos;re always
              happy to help.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Hours */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                <Clock size={20} className="text-red-400" />
                Opening Hours
              </h3>
              <div className="space-y-3">
                {dayOrder.map((day) => {
                  const value = hours[day];
                  const isClosed = !value || value.toLowerCase() === "closed";
                  const isToday =
                    new Date()
                      .toLocaleDateString("en-US", { weekday: "long" })
                      .toLowerCase() === day;

                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        isToday ? "bg-red-600/10 ring-1 ring-red-500/20" : ""
                      }`}
                    >
                      <span
                        className={`text-sm capitalize ${
                          isToday
                            ? "font-semibold text-red-400"
                            : "text-gray-300"
                        }`}
                      >
                        {day}
                        {isToday && (
                          <span className="ml-2 text-[10px] font-semibold tracking-wider text-red-400 uppercase">
                            Today
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-sm ${
                          isClosed
                            ? "text-gray-500"
                            : isToday
                              ? "font-medium text-white"
                              : "text-gray-400"
                        }`}
                      >
                        {value || "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Details */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                <Mail size={20} className="text-red-400" />
                Get In Touch
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600/15 text-red-400">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Address</p>
                    {googleMapsUrl ? (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 transition-colors hover:text-red-400"
                      >
                        {fullAddress}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">{fullAddress}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600/15 text-red-400">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Phone</p>
                    <a
                      href={`tel:${phone}`}
                      className="text-sm text-gray-400 transition-colors hover:text-red-400"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600/15 text-red-400">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <a
                      href={`mailto:${email}`}
                      className="text-sm text-gray-400 transition-colors hover:text-red-400"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                {/* Social Links */}
                {(social?.facebook || social?.twitter || social?.instagram) && (
                  <div className="pt-4">
                    <p className="mb-3 text-sm font-medium text-white">
                      Follow Us
                    </p>
                    <div className="flex gap-3">
                      {social?.facebook && (
                        <a
                          href={social.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-gray-400 transition-all hover:bg-red-600/20 hover:text-red-400"
                          aria-label="Facebook"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                      )}
                      {social?.twitter && (
                        <a
                          href={social.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-gray-400 transition-all hover:bg-red-600/20 hover:text-red-400"
                          aria-label="Twitter"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        </a>
                      )}
                      {social?.instagram && (
                        <a
                          href={social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-gray-400 transition-all hover:bg-red-600/20 hover:text-red-400"
                          aria-label="Instagram"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </BlackRedSection>

      {/* ─── CTA Section ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="section-title mb-4 text-gray-900!">
              Ready to Get Started?
            </h2>
            <p className="description mx-auto mb-8 max-w-xl">
              Browse our fleet, book a viewing, or enquire about any of our
              services. We&apos;re here to help.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/BrowseFleet"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-4 font-semibold text-white transition-all hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
              >
                <Car size={20} />
                Browse Fleet
              </Link>
              <Link
                href="/Services"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-4 font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                <Wrench size={20} />
                View Services
              </Link>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-4 font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                <Phone size={20} />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
