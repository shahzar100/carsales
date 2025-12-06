/**
 * TEST BOOKING FORM COMPONENT (294 lines)
 *
 * SUMMARY:
 * Legacy/test version of the booking form component for car services and viewings.
 * Handles customer information collection with validation and rate limiting.
 *
 * MAIN FEATURES:
 * - Customer contact information form (name, email, phone)
 * - Appointment date/time selection
 * - Form validation with error handling
 * - XSS protection via input sanitization
 * - Rate limiting to prevent spam submissions
 * - Integration with car data and service types
 *
 * TECHNICAL DEBT ISSUES:
 * - Marked as 'Test' but still in production use
 * - Manual form validation instead of using form library
 * - Mixing validation, sanitization, and UI logic
 * - Hardcoded rate limiting logic
 * - No proper accessibility features
 * - Duplicate code with main BookingForm component
 *
 * REFACTORING NEEDED:
 * - Remove if truly a test component, or rename properly
 * - Consolidate with main BookingForm component
 * - Extract validation/sanitization to utilities
 * - Use React Hook Form for better form management
 * - Implement proper rate limiting on backend
 * - Add accessibility features (ARIA labels, etc.)
 */

import React, { useState } from "react";

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

export default function BookingForm({
  onSubmit,
  carData,
  serviceType,
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    if (!formData.preferredDate) {
      newErrors.preferredDate = "Preferred date is required";
    }

    // Length validation for message
    if (formData.message.length > 2000) {
      newErrors.message = "Message too long (max 2000 characters)";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting check
    const currentTime = Date.now();
    if (currentTime - lastSubmitTime < 2000) {
      // 2 second cooldown
      return;
    }

    if (rateLimitCount >= 3) {
      return;
    }

    setIsSubmitting(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    setRateLimitCount((prev) => prev + 1);
    setLastSubmitTime(currentTime);

    try {
      if (onSubmit) {
        await onSubmit({
          customerName: sanitizeInput(formData.customerName),
          email: sanitizeInput(formData.email),
          phone: sanitizeInput(formData.phone),
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          message: sanitizeInput(formData.message),
        });
      }
    } catch (error) {
      setErrors({ submit: "Failed to submit booking. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Enforce character limits
    if (field === "message" && value.length > 2000) {
      value = value.substring(0, 2000);
    }

    const sanitizedValue = sanitizeInput(value);
    setFormData({ ...formData, [field]: sanitizedValue });

    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="customerName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name *
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            required
            aria-describedby={
              errors.customerName ? "customerName-error" : undefined
            }
            aria-invalid={!!errors.customerName}
            value={formData.customerName}
            onChange={(e) => handleInputChange("customerName", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.customerName && (
            <div
              id="customerName-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {errors.customerName}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.email && (
            <div
              id="email-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {errors.email}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            aria-describedby={errors.phone ? "phone-error" : undefined}
            aria-invalid={!!errors.phone}
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.phone && (
            <div
              id="phone-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {errors.phone}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="preferredDate"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Date *
          </label>
          <input
            id="preferredDate"
            name="preferredDate"
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            aria-describedby={
              errors.preferredDate ? "preferredDate-error" : undefined
            }
            aria-invalid={!!errors.preferredDate}
            value={formData.preferredDate}
            onChange={(e) => handleInputChange("preferredDate", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.preferredDate && (
            <div
              id="preferredDate-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {errors.preferredDate}
            </div>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          Additional Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          value={formData.message}
          onChange={(e) => handleInputChange("message", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <div className="mt-1 text-xs text-gray-500">
          {formData.message.length}/2000 characters
        </div>
      </div>

      {errors.submit && (
        <div className="text-sm text-red-600" role="alert">
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Booking"}
      </button>
    </form>
  );
}
