import React from "react";
import { Calendar, Clock } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";

const DateTimeStep = () => {
  const { viewingBooking, updateViewingBooking } = useViewing();

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">
        Select Date & Time
      </h4>

      <div className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
            Preferred Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={viewingBooking.selectedDate || ""}
              onChange={(e) =>
                updateViewingBooking({ selectedDate: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
              max={
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0]
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-400"
              required
            />
            {!viewingBooking.selectedDate && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
            Available dates: Today to next 30 days
          </p>
        </div>

        {/* Time Selection */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-blue-600" />
            Preferred Time
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <select
              value={viewingBooking.selectedTime || ""}
              onChange={(e) =>
                updateViewingBooking({ selectedTime: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
              required
            >
              <option value="" disabled className="text-gray-400">
                Select your preferred time slot
              </option>
              <optgroup label="Morning Sessions">
                <option value="09:00">9:00 AM - 10:00 AM</option>
                <option value="10:00">10:00 AM - 11:00 AM</option>
                <option value="11:00">11:00 AM - 12:00 PM</option>
              </optgroup>
              <optgroup label="Afternoon Sessions">
                <option value="12:00">12:00 PM - 1:00 PM</option>
                <option value="14:00">2:00 PM - 3:00 PM</option>
                <option value="15:00">3:00 PM - 4:00 PM</option>
                <option value="16:00">4:00 PM - 5:00 PM</option>
              </optgroup>
              <optgroup label="Evening Sessions">
                <option value="17:00">5:00 PM - 6:00 PM</option>
                <option value="18:00">6:00 PM - 7:00 PM</option>
              </optgroup>
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
            Each viewing session is approximately 1 hour
          </p>
        </div>

        {/* Additional Information */}
        {viewingBooking.selectedDate && viewingBooking.selectedTime && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-blue-900 mb-1">
                  Viewing Scheduled
                </h5>
                <p className="text-sm text-blue-700">
                  {new Date(viewingBooking.selectedDate).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimeStep;
