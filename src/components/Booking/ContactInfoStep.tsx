import React from "react";
import { User, Mail, Phone } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";

const ContactInfoStep = () => {
  const { viewingBooking, updateViewingBooking } = useViewing();

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">
        Contact Information
      </h4>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <User className="w-4 h-4 mr-2 text-blue-600" />
            Full Name
            <span className="text-red-500 ml-1">*</span>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-400"
              required
            />
            {!viewingBooking.customerInfo?.name && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
            Please provide your first and last name
          </p>
        </div>

        {/* Email Address */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Mail className="w-4 h-4 mr-2 text-blue-600" />
            Email Address
            <span className="text-red-500 ml-1">*</span>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-400"
              required
            />
            {!viewingBooking.customerInfo?.email && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
            We'll send viewing confirmation to this email
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Phone className="w-4 h-4 mr-2 text-blue-600" />
            Phone Number
            <span className="text-red-500 ml-1">*</span>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-400"
              required
            />
            {!viewingBooking.customerInfo?.phone && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
            For appointment reminders and updates
          </p>
        </div>

        {/* Contact Information Summary */}
        {viewingBooking.customerInfo?.name &&
          viewingBooking.customerInfo?.email &&
          viewingBooking.customerInfo?.phone && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-green-900 mb-2">
                    Contact Details Complete
                  </h5>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {viewingBooking.customerInfo.name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {viewingBooking.customerInfo.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
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
