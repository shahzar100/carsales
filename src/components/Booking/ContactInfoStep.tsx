import React from "react";
import { User, Mail, Phone } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";

const ContactInfoStep = () => {
  const { viewingBooking, updateViewingBooking } = useViewing();

  return (
    <div className="space-y-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800">
        Contact Information
      </h4>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <User className="mr-2 h-4 w-4 text-blue-600" />
            Full Name
            <span className="ml-1 text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={viewingBooking.customerInfo?.name || ""}
              onChange={(e) =>
                updateViewingBooking({
                  customerInfo: {
                    ...viewingBooking.customerInfo,
                    name: e.target.value,
                    email: viewingBooking.customerInfo?.email || "",
                    phone: viewingBooking.customerInfo?.phone || "",
                  },
                })
              }
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            {!viewingBooking.customerInfo?.name && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="flex items-center text-xs text-gray-500">
            <span className="mr-2 h-1 w-1 rounded-full bg-gray-400"></span>
            Please provide your first and last name
          </p>
        </div>

        {/* Email Address */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Mail className="mr-2 h-4 w-4 text-blue-600" />
            Email Address
            <span className="ml-1 text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={viewingBooking.customerInfo?.email || ""}
              onChange={(e) =>
                updateViewingBooking({
                  customerInfo: {
                    ...viewingBooking.customerInfo,
                    email: e.target.value,
                    name: viewingBooking.customerInfo?.name || "",
                    phone: viewingBooking.customerInfo?.phone || "",
                  },
                })
              }
              placeholder="Enter your email address"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            {!viewingBooking.customerInfo?.email && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="flex items-center text-xs text-gray-500">
            <span className="mr-2 h-1 w-1 rounded-full bg-gray-400"></span>
            We&apos;ll send viewing confirmation to this email
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Phone className="mr-2 h-4 w-4 text-blue-600" />
            Phone Number
            <span className="ml-1 text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={viewingBooking.customerInfo?.phone || ""}
              onChange={(e) =>
                updateViewingBooking({
                  customerInfo: {
                    ...viewingBooking.customerInfo,
                    phone: e.target.value,
                    name: viewingBooking.customerInfo?.name || "",
                    email: viewingBooking.customerInfo?.email || "",
                  },
                })
              }
              placeholder="Enter your phone number"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            {!viewingBooking.customerInfo?.phone && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="flex items-center text-xs text-gray-500">
            <span className="mr-2 h-1 w-1 rounded-full bg-gray-400"></span>
            For appointment reminders and updates
          </p>
        </div>

        {/* Contact Information Summary */}
        {viewingBooking.customerInfo?.name &&
          viewingBooking.customerInfo?.email &&
          viewingBooking.customerInfo?.phone && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start space-x-3">
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="mb-2 text-sm font-medium text-green-900">
                    Contact Details Complete
                  </h5>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>
                      <span className="font-medium">Name: </span>
                      {viewingBooking.customerInfo.name}
                    </p>
                    <p>
                      <span className="font-medium">Email: </span>
                      {viewingBooking.customerInfo.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone: </span>
                      {viewingBooking.customerInfo.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ContactInfoStep;
