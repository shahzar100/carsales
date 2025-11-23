import React from "react";
import { Calendar, User, Mail, Phone, Car, CheckCircle } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";

const ReviewStep = () => {
  const { viewingBooking } = useViewing();

  const formatTime = (time: string) => {
    const timeFormats: { [key: string]: string } = {
      "09:00": "9:00 AM - 10:00 AM",
      "10:00": "10:00 AM - 11:00 AM",
      "11:00": "11:00 AM - 12:00 PM",
      "12:00": "12:00 PM - 1:00 PM",
      "14:00": "2:00 PM - 3:00 PM",
      "15:00": "3:00 PM - 4:00 PM",
      "16:00": "4:00 PM - 5:00 PM",
      "17:00": "5:00 PM - 6:00 PM",
      "18:00": "6:00 PM - 7:00 PM",
    };
    return timeFormats[time] || time;
  };

  return (
    <div className="space-y-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800">
        Review & Confirm Your Booking
      </h4>

      <div className="space-y-6">
        {/* Vehicle Information */}
        {viewingBooking.carDetails && (
          <div className="rounded-lg bg-gray-50 p-4">
            <h5 className="mb-3 flex items-center text-sm font-medium text-gray-900">
              <Car className="mr-2 h-4 w-4 text-blue-600" />
              Vehicle Details
            </h5>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Vehicle:</span>{" "}
                {viewingBooking.carDetails.year}{" "}
                {viewingBooking.carDetails.make}{" "}
                {viewingBooking.carDetails.model}
              </p>
              <p>
                <span className="font-medium">Price:</span> £
                {viewingBooking.carDetails.price.toLocaleString()}
              </p>
              {viewingBooking.carDetails.mileage && (
                <p>
                  <span className="font-medium">Mileage:</span>{" "}
                  {viewingBooking.carDetails.mileage.toLocaleString()} miles
                </p>
              )}
              {viewingBooking.carDetails.fuel && (
                <p>
                  <span className="font-medium">Fuel Type:</span>{" "}
                  {viewingBooking.carDetails.fuel}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Date & Time Information */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h5 className="mb-3 flex items-center text-sm font-medium text-blue-900">
            <Calendar className="mr-2 h-4 w-4 text-blue-600" />
            Appointment Details
          </h5>
          <div className="space-y-2 text-sm text-blue-700">
            {viewingBooking.selectedDate && (
              <p>
                <span className="font-medium">Date:</span>{" "}
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
            )}
            {viewingBooking.selectedTime && (
              <p>
                <span className="font-medium">Time:</span>{" "}
                {formatTime(viewingBooking.selectedTime)}
              </p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        {viewingBooking.customerInfo && (
          <div className="rounded-lg bg-green-50 p-4">
            <h5 className="mb-3 flex items-center text-sm font-medium text-green-900">
              <User className="mr-2 h-4 w-4 text-green-600" />
              Contact Information
            </h5>
            <div className="space-y-2 text-sm text-green-700">
              <p className="flex items-center">
                <User className="mr-2 h-3 w-3" />
                <span className="font-medium">Name:</span>{" "}
                {viewingBooking.customerInfo.name}
              </p>
              <p className="flex items-center">
                <Mail className="mr-2 h-3 w-3" />
                <span className="font-medium">Email:</span>{" "}
                {viewingBooking.customerInfo.email}
              </p>
              <p className="flex items-center">
                <Phone className="mr-2 h-3 w-3" />
                <span className="font-medium">Phone:</span>{" "}
                {viewingBooking.customerInfo.phone}
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Message */}
        <div className="rounded-lg border border-blue-200 bg-linear-to-r from-blue-50 to-green-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h5 className="mb-1 text-sm font-medium text-gray-900">
                Ready to Confirm
              </h5>
              <p className="text-sm text-gray-600">
                Please review the details above and click &quot;Confirm
                Booking&quot; to schedule your viewing. You will receive a
                confirmation email with all the details and directions to our
                showroom.
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h5 className="mb-2 text-sm font-medium text-yellow-800">
            Important Information
          </h5>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• Please arrive 10 minutes before your scheduled time</li>
            <li>• Bring a valid driver&apos;s license for test drives</li>
            <li>
              • Contact us at least 2 hours in advance if you need to reschedule
            </li>
            <li>• Our team will prepare the vehicle for your viewing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
