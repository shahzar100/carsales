"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccountContact } from "@/hooks/useAccountContact";
import Form, { FormStep } from "../../Form/Form";
import Dropdown from "../../Form/Dropdown";
import {
  FormInput,
  FormTextarea,
  SummaryRow,
  SummaryCard,
  InfoBanner,
} from "../../Form/FormPrimitives";
import {
  CalendarDays,
  UserRound,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
import { useViewing } from "@/contexts/ViewingContext";
import { formatPrice, formatMileage, formatDate } from "@/lib/utils/format";
import TurnstileWidget from "@/components/Form/TurnstileWidget";
import { BOOKING_SLOTS } from "@/lib/utils/bookingSlots";
import { formatTime as formatSlotLabel } from "@/lib/utils/booking";

// ── Helpers ──────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s+()-]{7,20}$/;
const today = () => new Date().toISOString().split("T")[0];
const maxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

// (#4) Length cap only — React escapes on render, so removing characters
// here gave a false sense of safety. Server-side validation is the
// source of truth; cap at 500 to keep textareas reasonable.
const capLength = (input: string): string => input.slice(0, 500);

// Time-slot options — values come from the shared BOOKING_SLOTS constant
// (also enforced server-side); the label is the one-hour viewing window.
const timeSlots = BOOKING_SLOTS.map((value) => ({
  value,
  label: formatSlotLabel(value),
}));

const formatTime = (val: string) =>
  timeSlots.find((t) => t.value === val)?.label ?? val;

// ── Form data ────────────────────────────────────────────────
interface ViewingFormData {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface CarViewingFormProps {
  /** For testing — bypass the real fetch call */
  onSubmit?: (data: Record<string, string>) => Promise<unknown>;
}

// ═════════════════════════════════════════════════════════════
// CarViewingForm – multi-stage form consistent with admin forms
// ═════════════════════════════════════════════════════════════
const CarViewingForm: React.FC<CarViewingFormProps> = ({ onSubmit }) => {
  const { viewingBooking, clearViewingBooking } = useViewing();
  const router = useRouter();

  const [data, setData] = useState<ViewingFormData>({
    date: viewingBooking.selectedDate ?? "",
    time: viewingBooking.selectedTime ?? "",
    name: viewingBooking.customerInfo?.name ?? "",
    email: viewingBooking.customerInfo?.email ?? "",
    phone: viewingBooking.customerInfo?.phone ?? "",
    notes: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

  const update = (field: keyof ViewingFormData, value: string) =>
    setData((prev) => ({ ...prev, [field]: capLength(value) }));

  // Prefill name + email from the signed-in account. The email field is
  // locked below — the API forces it to the account email regardless
  // (see /api/bookings/viewing).
  const account = useAccountContact();
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      ...(account.name ? { name: account.name } : {}),
      ...(account.email ? { email: account.email } : {}),
    }));
  }, [account.name, account.email]);

  const car = viewingBooking.carDetails;

  // ── Steps ────────────────────────────────────────────────
  const steps: FormStep[] = useMemo(
    () => [
      // Step 1 — Date & Time
      {
        title: "Date & Time",
        description: "When would you like to view the vehicle?",
        icon: <CalendarDays className="h-5 w-5" />,
        validate: () => {
          if (!data.date) return "Please select a date";
          if (data.date < today()) return "Date cannot be in the past";
          if (!data.time) return "Please select a time slot";
          return true;
        },
        content: (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Preferred Date"
                type="date"
                value={data.date}
                onChange={(v) => update("date", v)}
                min={today()}
                max={maxDate()}
                required
              />
              <Dropdown
                label="Preferred Time"
                placeholder="Select a time slot"
                options={timeSlots}
                value={data.time}
                onChange={(v) => update("time", v)}
                required
              />
            </div>

            {data.date && data.time && (
              <InfoBanner variant="info">
                <strong>Your appointment:</strong>{" "}
                {formatDate(data.date, "long")} at{" "}
                {formatTime(data.time)}. Each viewing session is approximately 1
                hour.
              </InfoBanner>
            )}
          </div>
        ),
      },

      // Step 2 — Contact Details
      {
        title: "Contact Details",
        description: "How can we reach you?",
        icon: <UserRound className="h-5 w-5" />,
        validate: () => {
          if (!data.name.trim()) return "Full name is required";
          if (!data.email.trim()) return "Email address is required";
          if (!emailRegex.test(data.email))
            return "Please enter a valid email address";
          if (!data.phone.trim()) return "Phone number is required";
          if (!phoneRegex.test(data.phone))
            return "Please enter a valid phone number";
          return true;
        },
        content: (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Full Name"
                value={data.name}
                onChange={(v) => update("name", v)}
                placeholder="e.g. John Smith"
                required
              />
              <div>
                <FormInput
                  label="Email Address"
                  type="email"
                  value={data.email}
                  onChange={(v) => update("email", v)}
                  placeholder="e.g. john@example.com"
                  required
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your viewing is linked to your account email.
                </p>
              </div>
              <FormInput
                label="Phone Number"
                type="tel"
                value={data.phone}
                onChange={(v) => update("phone", v)}
                placeholder="e.g. 07700 900000"
                required
              />
            </div>
            <FormTextarea
              label="Additional Notes (optional)"
              value={data.notes}
              onChange={(v) => update("notes", v)}
              placeholder="Anything you'd like us to know before your visit..."
              rows={3}
            />

            <InfoBanner variant="info">
              We&apos;ll send viewing confirmation and directions to your email
              address.
            </InfoBanner>
          </div>
        ),
      },

      // Step 3 — Review & Submit
      {
        title: "Review & Confirm",
        description: "Check your details before confirming",
        icon: <ClipboardList className="h-5 w-5" />,
        content: submitted ? (
          <div className="space-y-5">
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
              <h4 className="mb-1 text-lg font-semibold text-emerald-800">
                Booking Confirmed!
              </h4>
              <p className="text-sm text-emerald-700">
                Your reference number is{" "}
                <span className="font-mono font-bold tracking-wider">
                  {bookingRef}
                </span>
              </p>
              <p className="mt-2 text-xs text-emerald-600">
                A confirmation email has been sent to {data.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {car && (
              <SummaryCard title="Vehicle">
                <SummaryRow
                  label="Vehicle"
                  value={`${car.year} ${car.make} ${car.model}`}
                />
                <SummaryRow label="Price" value={formatPrice(car.price)} />
                {car.mileage && (
                  <SummaryRow
                    label="Mileage"
                    value={`${formatMileage(car.mileage)} miles`}
                  />
                )}
                {car.fuel && <SummaryRow label="Fuel" value={car.fuel} />}
              </SummaryCard>
            )}

            <SummaryCard title="Appointment">
              <SummaryRow label="Date" value={formatDate(data.date, "long")} />
              <SummaryRow label="Time" value={formatTime(data.time)} />
            </SummaryCard>

            <SummaryCard title="Contact">
              <SummaryRow label="Name" value={data.name} />
              <SummaryRow label="Email" value={data.email} />
              <SummaryRow label="Phone" value={data.phone} />
              {data.notes && <SummaryRow label="Notes" value={data.notes} />}
            </SummaryCard>

            <InfoBanner variant="warning">
              <strong>Important:</strong> Please arrive 10 minutes early. Bring
              a valid driver&apos;s licence if you&apos;d like a test drive.
            </InfoBanner>

            {/* (#17) Turnstile renders only when the env var is set;
                invisible in local dev to keep tests + manual testing fast. */}
            <TurnstileWidget onToken={setTurnstileToken} />
          </div>
        ),
      },
    ],
    [data, car, submitted, bookingRef]
  );

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    // Testing override
    if (onSubmit) {
      await onSubmit({
        customerName: data.name,
        email: data.email,
        phone: data.phone,
        preferredDate: data.date,
        preferredTime: data.time,
        message: data.notes,
      });
      return;
    }

    const payload = {
      carId: viewingBooking.carId,
      carDetails: viewingBooking.carDetails,
      customerInfo: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      appointmentDate: data.date,
      appointmentTime: data.time,
      turnstileToken,
    };

    const res = await fetch("/api/bookings/viewing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to create booking");
    }

    setBookingRef(result.data.bookingReference);
    setSubmitted(true);

    // Redirect after short delay
    setTimeout(() => {
      clearViewingBooking();
      router.replace(
        `/Booking/confirmation?ref=${result.data.bookingReference}&email=${encodeURIComponent(data.email)}`
      );
    }, 2000);
  };

  return (
    <Form steps={steps} onSubmit={handleSubmit} submitLabel="Confirm Booking" />
  );
};

export default CarViewingForm;
