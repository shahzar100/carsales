import React from "react";
import { Calendar, Clock } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";

const DateTimeStep = () => {
  const { viewingBooking, updateViewingBooking } = useViewing();

  return (
    <div className="space-y-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800">
        Select Date & Time
      </h4>

      <div className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="mr-2 h-4 w-4 text-blue-600" />
            Preferred Date
            <span className="ml-1 text-red-500">*</span>
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            {!viewingBooking.selectedDate && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <p className="flex items-center text-xs text-gray-500">
            <span className="mr-2 h-1 w-1 rounded-full bg-gray-400"></span>
            Available dates: Today to next 30 days
          </p>
        </div>

        {/* Time Selection */}
        <div className="space-y-3">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Clock className="mr-2 h-4 w-4 text-blue-600" />
            Preferred Time
            <span className="ml-1 text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={viewingBooking.selectedTime || ""}
              onChange={(e) =>
                updateViewingBooking({ selectedTime: e.target.value })
              }
              className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg
                className="h-5 w-5 text-gray-400"
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
          <p className="flex items-center text-xs text-gray-500">
            <span className="mr-2 h-1 w-1 rounded-full bg-gray-400"></span>
            Each viewing session is approximately 1 hour
          </p>
        </div>

        {/* Additional Information */}
        {viewingBooking.selectedDate && viewingBooking.selectedTime && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h5 className="mb-1 text-sm font-medium text-blue-900">
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
