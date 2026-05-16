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
  ArrowRight,
} from "lucide-react";
import { BlackRedSection } from "@/components/Services/Common";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { safeExternalHref } from "@/lib/utils/url";

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

export const metadata: Metadata = {
  title: `Contact — ${businessName}`,
  description:
    "Contact us for vehicle enquiries, service bookings, accident claims support, and more. Phone, email, or visit our showroom.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact — ${businessName}`,
    description:
      "Get in touch with us for any automotive enquiry. We're here to help.",
    url: "/contact",
  },
};

export default async function Contact() {
  const businessInfo = await getBusinessInfo();

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
  // (Fix 3 / security) Belt-and-braces protocol gate at render: even
  // though the admin shop write handler rejects non-`https:` Google
  // Maps URLs at the API boundary, legacy rows / DB-direct edits could
  // still surface a `javascript:` href here. `safeExternalHref` returns
  // `undefined` for anything that isn't `https:`. We fall back to the
  // computed maps.google.com search URL (always `https:`) when the
  // admin URL is missing OR unsafe, and only suppress the link entirely
  // when even the fallback can't be built — i.e. address is empty.
  const safeAdminMapsUrl = safeExternalHref(googleMapsUrl);
  const fallbackMapsHref = fullAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`
    : undefined;
  const mapsHref = safeAdminMapsUrl ?? fallbackMapsHref;

  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute -top-32 right-0 h-125 w-125 rounded-full bg-red-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-red-600/3 blur-3xl" />

        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
              <MessageSquare size={14} />
              Contact Us
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s{" "}
              <span className="bg-linear-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Talk
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              Have a question about a vehicle, need a service quote, or want to
              discuss an accident claim? Reach out — we&apos;re here to help.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
              >
                <Phone size={18} />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
              >
                <Mail size={18} />
                {email}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact Cards ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Phone */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-all duration-200 hover:shadow-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Phone size={28} />
                </div>
                <h3 className="heading-3 mb-2">Call Us</h3>
                <p className="mb-4 text-sm text-gray-600">
                  Speak directly with our team
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
                  We reply within 24 hours
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
                <h3 className="heading-3 mb-2">Visit</h3>
                <p className="mb-4 text-sm text-gray-600">
                  Come see our showroom
                </p>
                {mapsHref ? (
                  <Link
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-red-600 transition-colors hover:text-red-500"
                  >
                    {address}, {city}
                  </Link>
                ) : (
                  <span className="text-base font-semibold text-gray-700">
                    {address}, {city}
                  </span>
                )}
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
            When We&apos;re Open
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

          <p className="mt-6 text-sm text-gray-400">
            Breakdown recovery available 24/7 — call us anytime.
          </p>
        </div>
      </BlackRedSection>

      {/* ─── Quick Links ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-red-600 uppercase">
                Quick Links
              </p>
              <h2 className="section-title mb-4">
                Looking for Something Specific?
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Car,
                  title: "Browse Fleet",
                  description: "View our vehicle collection",
                  href: "/BrowseFleet",
                },
                {
                  icon: Wrench,
                  title: "Our Services",
                  description: "Detailing, tinting & repairs",
                  href: "/Services",
                },
                {
                  icon: Shield,
                  title: "Accident Claims",
                  description: "Claim management support",
                  href: "/AccidentClaims",
                },
                {
                  icon: Truck,
                  title: "Recovery",
                  description: "24/7 breakdown assistance",
                  href: "/Recoveries",
                },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-all duration-200 hover:border-red-100 hover:shadow-lg"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {link.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="ml-auto shrink-0 text-gray-300 transition-colors group-hover:text-red-500"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
