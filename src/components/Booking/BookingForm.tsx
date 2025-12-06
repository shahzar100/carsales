import React, { useState } from "react";
import Button from "../Helpful/Buttons/Button";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";
import DateTimeStep from "./DateTimeStep";
import ContactInfoStep from "./ContactInfoStep";
import ReviewStep from "./ReviewStep";
import { useRouter } from "next/navigation";

// Validation utilities
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/<.*?>/g, "")
    .substring(0, 2000); // Length limit
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface BookingFormProps {
  onSubmit?: (data: any) => Promise<any>;
  carData?: any;
  serviceType?: string;
}

const BookingForm = ({
  onSubmit,
  carData,
  serviceType,
}: BookingFormProps = {}) => {
  const { viewingBooking, clearViewingBooking } = useViewing();
  const router = useRouter();
  const [formPart, setFormPart] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handlePrevious = () => {
    if (formPart > 1) {
      setFormPart(formPart - 1);
    }
  };

  const handleNext = async () => {
    if (formPart === 3) {
      await handleSubmit();
    } else {
      setFormPart(formPart + 1);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!viewingBooking.customerInfo?.name?.trim()) {
      newErrors.customerName = "Name is required";
    }

    const email = viewingBooking.customerInfo?.email?.trim();
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!viewingBooking.customerInfo?.phone?.trim()) {
      newErrors.phone = "Phone is required";
    }

    if (!viewingBooking.selectedDate) {
      newErrors.preferredDate = "Preferred date is required";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    // Rate limiting check
    const currentTime = Date.now();
    if (currentTime - lastSubmitTime < 2000) {
      // 2 second cooldown
      setError("Please wait before submitting again.");
      return;
    }

    if (rateLimitCount >= 3) {
      setError("Too many attempts. Please refresh the page.");
      return;
    }

    setSubmitting(true);
    setError("");
    setErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      carId: viewingBooking.carId,
      carDetails: viewingBooking.carDetails,
      customerInfo: {
        name: sanitizeInput(viewingBooking.customerInfo?.name || ""),
        email: sanitizeInput(viewingBooking.customerInfo?.email || ""),
        phone: sanitizeInput(viewingBooking.customerInfo?.phone || ""),
      },
      appointmentDate: viewingBooking.selectedDate,
      appointmentTime: viewingBooking.selectedTime,
      dealership: viewingBooking.dealership,
    };

    setRateLimitCount((prev) => prev + 1);
    setLastSubmitTime(currentTime);

    try {
      // Use external onSubmit prop if provided (for testing)
      if (onSubmit) {
        await onSubmit({
          customerName: sanitizedData.customerInfo.name,
          email: sanitizedData.customerInfo.email,
          phone: sanitizedData.customerInfo.phone,
          preferredDate: sanitizedData.appointmentDate,
          preferredTime: sanitizedData.appointmentTime || "",
          message: "",
        });
        return;
      }

      const response = await fetch("/api/bookings/viewing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const bookingRef = result.data.bookingReference;
        const customerEmail = viewingBooking.customerInfo?.email;

        // Set redirecting state to prevent re-renders
        setRedirecting(true);

        // Use replace to immediately navigate without adding to history
        router.replace(
          `/Booking/confirmation?ref=${bookingRef}&email=${encodeURIComponent(
            customerEmail || ""
          )}`
        );

        // Clear booking data after a short delay to ensure navigation starts
        setTimeout(() => {
          clearViewingBooking();
        }, 100);
      } else {
        setError(result.error || "Failed to create booking. Please try again.");
      }
    } catch (err) {
      console.log("Booking submission error:", err);
      setError("Failed to submit booking. Please try again.");
    } finally {
      if (!redirecting) {
        setSubmitting(false);
      }
    }
  };

  // Show loading state during redirect to prevent flash of other content
  if (redirecting) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-white p-6 shadow-lg">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 animate-pulse text-green-500" />
          <h3 className="mb-2 text-2xl font-bold text-gray-900">
            Booking Confirmed!
          </h3>
          <p className="text-gray-600">Redirecting to confirmation...</p>
        </div>
      </div>
    );
  }

  const isStep1Valid =
    viewingBooking.selectedDate && viewingBooking.selectedTime;
  const isStep2Valid =
    viewingBooking.customerInfo?.name?.trim() &&
    viewingBooking.customerInfo?.email?.trim() &&
    viewingBooking.customerInfo?.phone?.trim();

  return (
    <div className="flex h-full min-h-[400px] flex-col rounded-lg bg-white p-6 text-gray-800 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold">Schedule Your Viewing</h3>
        <p className="text-sm text-gray-600">Step {formPart} of 3</p>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(formPart / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1">
        {formPart === 1 && <DateTimeStep />}
        {formPart === 2 && <ContactInfoStep />}
        {formPart === 3 && <ReviewStep />}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
        <Button
          text="Previous"
          onClick={handlePrevious}
          icon={ArrowLeft}
          disabled={formPart === 1 || submitting || redirecting}
          iconPlacement="left"
        />

        <div className="text-sm text-gray-500">{formPart} of 3</div>

        <Button
          text={
            formPart === 3
              ? submitting
                ? "Submitting..."
                : "Confirm Booking"
              : "Next"
          }
          onClick={handleNext}
          icon={ArrowRight}
          disabled={
            submitting ||
            redirecting ||
            (formPart === 1 && !isStep1Valid) ||
            (formPart === 2 && !isStep2Valid)
          }
          iconPlacement="right"
        />
      </div>
    </div>
  );
};

export default BookingForm;
