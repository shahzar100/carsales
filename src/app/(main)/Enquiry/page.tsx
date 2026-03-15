import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Car,
  Wrench,
  Shield,
  Truck,
} from "lucide-react";
import { BlackRedSection } from "@/components/Services/Common";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

export const metadata: Metadata = {
  title: `Contact Us — ${businessName}`,
  description:
    "Get in touch with our team for enquiries about vehicles, services, bookings, or anything else. We're here to help.",
  alternates: { canonical: "/Enquiry" },
  openGraph: {
    title: `Contact Us — ${businessName}`,
    description:
      "Contact us for vehicle enquiries, service bookings, or general questions. We're happy to help.",
    url: "/Enquiry",
  },
};

export default async function Enquiry() {
  const businessInfo = await getBusinessInfo();

  const name = businessInfo.businessName;
  const phone = businessInfo.phone;
  const email = businessInfo.email;
  const bookingsEmail = businessInfo.bookingsEmail;
  const address = businessInfo.address;
  const city = businessInfo.city;
  const state = businessInfo.state;
  const zip = businessInfo.zipCode;
  const hours = businessInfo.hours;
  const googleMapsUrl = businessInfo.googleMapsUrl;

  const fullAddress = `${address}, ${city}, ${state} ${zip}`.trim();
  const mapsHref =
    googleMapsUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  const enquiryTypes = [
    {
      icon: Car,
      title: "Vehicle Enquiries",
      description:
        "Looking for a specific car? Want details on a vehicle in our collection? Get in touch and we'll help you find the perfect match.",
      action: "Browse Fleet",
      href: "/BrowseFleet",
    },
    {
      icon: Wrench,
      title: "Service Bookings",
      description:
        "Detailing, tinting, repairs — book a service online or speak to our team about the right package for your vehicle.",
      action: "View Services",
      href: "/Services",
    },
    {
      icon: Shield,
      title: "Accident Claims",
      description:
        "Been in an accident? Our claims team can guide you through the entire process and arrange repairs.",
      action: "Learn More",
      href: "/AccidentClaims",
    },
    {
      icon: Truck,
      title: "Breakdown Recovery",
      description:
        "Stranded on the roadside? Our 24/7 recovery team is ready to come to your rescue.",
      action: "Recovery Info",
      href: "/Recoveries",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute -top-32 right-0 h-125 w-125 rounded-full bg-red-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-red-600/3 blur-3xl" />

        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
              <MessageSquare size={14} />
              We&apos;d Love to Hear from You
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Get in{" "}
              <span className="bg-linear-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              Whether you have a question about a vehicle, need a service quote,
              or just want to say hello — our friendly team is here to help.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
              >
                <Phone size={18} />
                Call: {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
              >
                <Mail size={18} />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact Details ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Phone */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-all duration-200 hover:shadow-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Phone size={28} />
                </div>
                <h3 className="heading-3 mb-2">Phone</h3>
                <p className="mb-4 text-sm text-gray-600">
                  Speak to our team directly
                </p>
                <a
                  href={`tel:${phone}`}
                  className="text-lg font-semibold text-red-600 transition-colors hover:text-red-500"
                >
                  {phone}
                </a>
              </div>

              {/* Email */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-all duration-200 hover:shadow-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Mail size={28} />
                </div>
                <h3 className="heading-3 mb-2">Email</h3>
                <p className="mb-4 text-sm text-gray-600">
                  {bookingsEmail && bookingsEmail !== email
                    ? "General & booking enquiries"
                    : "Send us an email anytime"}
                </p>
                <div className="space-y-1">
                  <a
                    href={`mailto:${email}`}
                    className="block text-base font-semibold text-red-600 transition-colors hover:text-red-500"
                  >
                    {email}
                  </a>
                  {bookingsEmail && bookingsEmail !== email && (
                    <a
                      href={`mailto:${bookingsEmail}`}
                      className="block text-sm text-gray-500 transition-colors hover:text-red-500"
                    >
                      Bookings: {bookingsEmail}
                    </a>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-all duration-200 hover:shadow-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <MapPin size={28} />
                </div>
                <h3 className="heading-3 mb-2">Visit Us</h3>
                <p className="mb-4 text-sm text-gray-600">
                  Come see our showroom
                </p>
                <Link
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-red-600 transition-colors hover:text-red-500"
                >
                  {address}, {city}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Opening Hours ─── */}
      <BlackRedSection>
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-red-400">
            <Clock size={20} />
            <span className="text-sm font-semibold tracking-widest uppercase">
              Opening Hours
            </span>
          </div>
          <h2 className="mb-8 text-3xl font-bold text-white sm:text-4xl">
            When You Can Reach Us
          </h2>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            {dayOrder.map((day) => (
              <div
                key={day}
                className="flex items-center justify-between border-b border-white/5 px-6 py-4 last:border-b-0"
              >
                <span className="font-medium text-white capitalize">{day}</span>
                <span
                  className={`text-sm ${hours[day] === "Closed" ? "text-red-400" : "text-gray-300"}`}
                >
                  {hours[day]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </BlackRedSection>

      {/* ─── How Can We Help ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                Quick Links
              </p>
              <h2 className="section-title mb-4">How Can We Help?</h2>
              <p className="description mx-auto max-w-2xl text-gray-600">
                Select a topic below or get in contact directly — we&apos;re
                happy to assist with any automotive enquiry.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {enquiryTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.title}
                    className="group rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-200 hover:border-red-100 hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                      <Icon size={24} />
                    </div>
                    <h3 className="heading-4 mb-2">{type.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600">
                      {type.description}
                    </p>
                    <Link
                      href={type.href}
                      className="inline-flex items-center text-sm font-semibold text-red-600 transition-colors hover:text-red-500"
                    >
                      {type.action} →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Map Section ─── */}
      {googleMapsUrl && (
        <section className="bg-gray-50 py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="section-title mb-4">Find Us</h2>
              <p className="description mx-auto mb-8 max-w-2xl text-gray-600">
                We&apos;re conveniently located at {fullAddress}. Pop in for a
                browse or to speak with our team in person.
              </p>
              <Link
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
              >
                <MapPin size={18} />
                Open in Google Maps
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
