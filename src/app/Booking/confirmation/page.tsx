import React from "react";
import { CheckCircle, Calendar, Mail, Phone, Car } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    email?: string;
  }>;
}

const BookingConfirmationPage = async ({ searchParams }: PageProps) => {
  const { ref, email } = await searchParams;

  if (!ref) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Confirmation Link
          </h1>
          <p className="text-gray-600 mb-6">
            This confirmation link is invalid or has expired.
          </p>
          <Link
            href="/BrowseFleet"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Our Fleet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Your car viewing appointment has been successfully scheduled.
          </p>
        </div>

        {/* Booking Reference Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Your Booking Reference</p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-3xl font-bold text-blue-600 font-mono tracking-wider">
                {ref}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Please save this reference number for your records
            </p>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            What Happens Next?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Confirmation Email Sent
                </p>
                <p className="text-gray-600 text-sm">
                  {email
                    ? `A detailed confirmation has been sent to ${email}`
                    : "A detailed confirmation email has been sent to your email address"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Prepare for Your Visit
                </p>
                <p className="text-gray-600 text-sm">
                  Bring a valid driver's license if you'd like to test drive the
                  vehicle
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Arrive On Time</p>
                <p className="text-gray-600 text-sm">
                  Please arrive 5-10 minutes early for your appointment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link
            href={`/Booking/lookup?ref=${ref}`}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Calendar size={20} />
            View Booking Details
          </Link>

          <Link
            href="/BrowseFleet"
            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Car size={20} />
            Browse More Cars
          </Link>
        </div>

        {/* Contact Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Need to make changes?
          </h3>
          <p className="text-yellow-700 text-sm mb-3">
            If you need to cancel or reschedule, please contact us at least 24
            hours in advance.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="tel:(555) 123-4567"
              className="flex items-center gap-2 text-yellow-800 hover:text-yellow-900 font-medium"
            >
              <Phone size={16} />
              (555) 123-4567
            </a>
            <a
              href="mailto:bookings@carsalesviewing.com"
              className="flex items-center gap-2 text-yellow-800 hover:text-yellow-900 font-medium"
            >
              <Mail size={16} />
              bookings@carsalesviewing.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
