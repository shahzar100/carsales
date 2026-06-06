import React from "react";
import type { Metadata } from "next";
import { CheckCircle, Calendar, Mail, Phone, Car } from "lucide-react";
import Link from "next/link";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

// Per-user / per-request; must not cache. (Audit #1.)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    email?: string;
  }>;
}

const BookingConfirmationPage = async ({ searchParams }: PageProps) => {
  const [{ ref, email }, businessInfo] = await Promise.all([
    searchParams,
    getBusinessInfo(),
  ]);

  if (!ref) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="page-title mb-2">Invalid Confirmation Link</h1>
          <p className="mb-6 text-gray-600">
            This confirmation link is missing a reference. If you have a
            booking reference, look it up below — otherwise browse our fleet
            to start a new booking.
          </p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/Booking/lookup"
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Look up a booking
            </Link>
            <Link
              href="/BrowseFleet"
              className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              Browse our fleet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="page-title mb-2">Booking Confirmed! 🎉</h1>
          <p className="description">
            Your car viewing appointment has been successfully scheduled.
          </p>
        </div>

        {/* Booking Reference Card */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <p className="mb-2 text-sm text-gray-600">Your Booking Reference</p>
            <div className="mb-4 rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <p className="font-mono text-xl font-bold tracking-wider text-red-600 sm:text-2xl md:text-3xl">
                {ref}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Please save this reference number for your records
            </p>
          </div>
        </div>

        {/* Important Information */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="section-title mb-4 flex items-center">
            <Mail className="mr-2 h-5 w-5 text-red-600" />
            What Happens Next?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-sm font-semibold text-red-600">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Confirmation Email Sent
                </p>
                <p className="text-sm text-gray-600">
                  {email
                    ? `A detailed confirmation has been sent to ${email}`
                    : "A detailed confirmation email has been sent to your email address"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-sm font-semibold text-red-600">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Prepare for Your Visit
                </p>
                <p className="text-sm text-gray-600">
                  Bring a valid driver&apos;s license if you&apos;d like to test
                  drive the vehicle
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-sm font-semibold text-red-600">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Arrive On Time</p>
                <p className="text-sm text-gray-600">
                  Please arrive 5-10 minutes early for your appointment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href={`/Booking/lookup?ref=${ref}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Calendar size={20} />
            View Booking Details
          </Link>

          <Link
            href="/BrowseFleet"
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
          >
            <Car size={20} />
            Browse More Cars
          </Link>
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="mb-2 font-semibold text-yellow-800">
            Need to make changes?
          </h3>
          <p className="mb-3 text-sm text-yellow-700">
            If you need to cancel or reschedule, please contact us at least 24
            hours in advance.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`tel:${businessInfo.phone}`}
              className="flex items-center gap-2 font-medium text-yellow-800 hover:text-yellow-900"
            >
              <Phone size={16} />
              {businessInfo.phone}
            </a>
            <a
              href={`mailto:${businessInfo.bookingsEmail || businessInfo.email}`}
              className="flex items-center gap-2 font-medium text-yellow-800 hover:text-yellow-900"
            >
              <Mail size={16} />
              {businessInfo.bookingsEmail || businessInfo.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
