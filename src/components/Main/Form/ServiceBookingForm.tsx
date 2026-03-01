"use client";
import React, { useState, useMemo } from "react";
import Form, { FormStep } from "../../Form/Form";
import Dropdown from "../../Form/Dropdown";
import {
  FormInput,
  FormTextarea,
  SummaryRow,
  SummaryCard,
  InfoBanner,
  SelectionCard,
} from "../../Form/FormPrimitives";
import {
  Wrench,
  CalendarDays,
  UserRound,
  Car,
  ClipboardList,
  CheckCircle,
  Sparkles,
  Shield,
  MessageSquareQuote,
  CalendarCheck,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s+()-]{7,20}$/;
const today = () => new Date().toISOString().split("T")[0];
const maxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
};

const sanitizeInput = (input: string): string =>
  input
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/<.*?>/g, "")
    .substring(0, 1000);

const timeSlots = [
  { value: "09:00", label: "9:00 AM" },
  { value: "09:30", label: "9:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "14:30", label: "2:30 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "15:30", label: "3:30 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "16:30", label: "4:30 PM" },
  { value: "17:00", label: "5:00 PM" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (val: string) =>
  timeSlots.find((t) => t.value === val)?.label ?? val;

// ── Service categories ───────────────────────────────────────
const serviceCategories = [
  {
    value: "Detailing",
    title: "Car Detailing",
    description: "Premium interior & exterior cleaning and protection",
    items: [
      "Interior & Exterior Deep Clean",
      "Paint Protection & Waxing",
      "Ceramic Coating Available",
    ],
    icon: <Sparkles className="h-5 w-5" />,
    activeColour: "border-blue-500 bg-blue-50/50",
  },
  {
    value: "Window Tint",
    title: "Window Tinting",
    description: "Professional tinting for privacy and UV protection",
    items: [
      "Premium Film Quality",
      "UV Ray Protection",
      "Lifetime Warranty Options",
    ],
    icon: <Shield className="h-5 w-5" />,
    activeColour: "border-purple-500 bg-purple-50/50",
  },
  {
    value: "Repair",
    title: "Auto Repair",
    description: "Expert automotive repair for all makes and models",
    items: [
      "Engine Diagnostics",
      "Brake & Safety Systems",
      "Electrical & Transmission",
    ],
    icon: <Wrench className="h-5 w-5" />,
    activeColour: "border-green-500 bg-green-50/50",
  },
];

// ── Sub-service options per category ─────────────────────────
const subServiceOptions: Record<string, { value: string; label: string }[]> = {
  Detailing: [
    { value: "Bronze - Mini Valet", label: "Bronze — Mini Valet (£150)" },
    {
      value: "Silver - Full Inside",
      label: "Silver — Mini Outside, Full Inside (£280)",
    },
    {
      value: "Gold - Complete Premium",
      label: "Gold — Complete Premium Service (£450)",
    },
  ],
  "Window Tint": [
    { value: "Dyed Film", label: "Dyed Film (£200 – £400)" },
    { value: "Carbon Series", label: "Carbon Series (£300 – £600)" },
    { value: "Ceramic Premium", label: "Ceramic Premium (£400 – £800)" },
  ],
  Repair: [
    { value: "Engine & Performance", label: "Engine & Performance" },
    { value: "Brakes & Safety", label: "Brakes & Safety" },
    { value: "Electrical Systems", label: "Electrical Systems" },
    { value: "Transmission & Drivetrain", label: "Transmission & Drivetrain" },
    { value: "General Service", label: "General Service / MOT" },
    { value: "Other", label: "Other (describe below)" },
  ],
};

// ── Form data ────────────────────────────────────────────────
interface ServiceFormData {
  purpose: "quote" | "book";
  serviceType: string;
  servicePackage: string;
  serviceDetails: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleReg: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
}

interface ServiceBookingFormProps {
  /** Pre-select a service category */
  defaultService?: string;
  /** For testing — bypass the real fetch call */
  onSubmit?: (data: Record<string, string>) => Promise<unknown>;
}

// ═════════════════════════════════════════════════════════════
// ServiceBookingForm – multi-stage, consistent with admin forms
// ═════════════════════════════════════════════════════════════
const ServiceBookingForm: React.FC<ServiceBookingFormProps> = ({
  defaultService = "",
  onSubmit,
}) => {
  const [data, setData] = useState<ServiceFormData>({
    purpose: "book",
    serviceType: defaultService,
    servicePackage: "",
    serviceDetails: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleReg: "",
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const update = (field: keyof ServiceFormData, value: string) =>
    setData((prev) => ({ ...prev, [field]: sanitizeInput(value) }));

  const currentYear = new Date().getFullYear();

  // ── Steps ────────────────────────────────────────────────
  const steps: FormStep[] = useMemo(
    () => [
      // Step 1 — Service Selection
      {
        title: "Service",
        description: "What service do you need?",
        icon: <Wrench className="h-5 w-5" />,
        validate: () => {
          if (!data.serviceType) return "Please select a service category";
          return true;
        },
        content: (
          <div className="space-y-5">
            {/* Purpose toggle — Get Quote or Book Service */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                What would you like to do?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setData((prev) => ({ ...prev, purpose: "quote" }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    data.purpose === "quote"
                      ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  Get a Quote
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setData((prev) => ({ ...prev, purpose: "book" }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    data.purpose === "book"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <CalendarCheck className="h-4 w-4" />
                  Book Service
                </button>
              </div>
            </div>

            {defaultService ? (
              /* Locked to the page's service — show only the matching card */
              (() => {
                const locked = serviceCategories.find(
                  (c) => c.value === defaultService
                );
                return locked ? (
                  <div
                    className={`rounded-xl border-2 p-4 ${locked.activeColour}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/80 p-2 shadow-sm">
                        {locked.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {locked.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {locked.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()
            ) : (
              /* No default — let the user pick */
              <div className="grid gap-4 sm:grid-cols-3">
                {serviceCategories.map((cat) => (
                  <SelectionCard
                    key={cat.value}
                    selected={data.serviceType === cat.value}
                    onSelect={() => {
                      setData((prev) => ({
                        ...prev,
                        serviceType: cat.value,
                        servicePackage: "",
                      }));
                    }}
                    title={cat.title}
                    description={cat.description}
                    items={cat.items}
                    activeColour={cat.activeColour}
                  />
                ))}
              </div>
            )}

            {data.serviceType && subServiceOptions[data.serviceType] && (
              <Dropdown
                label="Package / Service"
                placeholder="Select a specific option"
                options={subServiceOptions[data.serviceType]}
                value={data.servicePackage}
                onChange={(v) => update("servicePackage", v)}
              />
            )}

            <FormTextarea
              label="Additional Details (optional)"
              value={data.serviceDetails}
              onChange={(v) => update("serviceDetails", v)}
              placeholder="Describe the issue or any special requests..."
              rows={3}
            />
          </div>
        ),
      },

      // Step 2 — Vehicle Info
      {
        title: "Vehicle",
        description: "Tell us about your vehicle",
        icon: <Car className="h-5 w-5" />,
        validate: () => {
          if (!data.vehicleMake.trim()) return "Vehicle make is required";
          if (!data.vehicleModel.trim()) return "Vehicle model is required";
          if (!data.vehicleYear) return "Vehicle year is required";
          const y = Number(data.vehicleYear);
          if (y < 1900 || y > currentYear + 1)
            return `Year must be between 1900 and ${currentYear + 1}`;
          return true;
        },
        content: (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Make"
                value={data.vehicleMake}
                onChange={(v) => update("vehicleMake", v)}
                placeholder="e.g. BMW"
                required
              />
              <FormInput
                label="Model"
                value={data.vehicleModel}
                onChange={(v) => update("vehicleModel", v)}
                placeholder="e.g. 3 Series"
                required
              />
              <FormInput
                label="Year"
                type="number"
                value={data.vehicleYear}
                onChange={(v) => update("vehicleYear", v)}
                placeholder={`e.g. ${currentYear}`}
                min="1900"
                max={String(currentYear + 1)}
                required
              />
              <FormInput
                label="Registration (optional)"
                value={data.vehicleReg}
                onChange={(v) => update("vehicleReg", v)}
                placeholder="e.g. AB12 CDE"
              />
            </div>

            <InfoBanner variant="info">
              Providing your registration plate helps us prepare the correct
              parts and materials before your appointment.
            </InfoBanner>
          </div>
        ),
      },

      // Step 3 — Date & Time
      {
        title: "Date & Time",
        description: "When suits you best?",
        icon: <CalendarDays className="h-5 w-5" />,
        validate: () => {
          if (!data.date) return "Please select a date";
          if (data.date < today()) return "Date cannot be in the past";
          if (!data.time) return "Please select a time";
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
                placeholder="Select a time"
                options={timeSlots}
                value={data.time}
                onChange={(v) => update("time", v)}
                required
              />
            </div>

            {data.date && data.time && (
              <InfoBanner variant="info">
                <strong>Your appointment:</strong> {formatDate(data.date)} at{" "}
                {formatTime(data.time)}.
              </InfoBanner>
            )}
          </div>
        ),
      },

      // Step 4 — Contact Details
      {
        title: "Contact",
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
              <FormInput
                label="Email Address"
                type="email"
                value={data.email}
                onChange={(v) => update("email", v)}
                placeholder="e.g. john@example.com"
                required
              />
              <FormInput
                label="Phone Number"
                type="tel"
                value={data.phone}
                onChange={(v) => update("phone", v)}
                placeholder="e.g. 07700 900000"
                required
              />
            </div>

            <InfoBanner variant="info">
              We&apos;ll send booking confirmation and updates to your email
              address.
            </InfoBanner>
          </div>
        ),
      },

      // Step 5 — Review & Submit
      {
        title: "Review",
        description: "Confirm your booking details",
        icon: <ClipboardList className="h-5 w-5" />,
        content: submitted ? (
          <div className="space-y-5">
            <div
              className={`rounded-xl border-2 p-6 text-center ${
                data.purpose === "quote"
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <CheckCircle
                className={`mx-auto mb-3 h-12 w-12 ${
                  data.purpose === "quote"
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              />
              <h4
                className={`mb-1 text-lg font-semibold ${
                  data.purpose === "quote"
                    ? "text-amber-800"
                    : "text-emerald-800"
                }`}
              >
                {data.purpose === "quote"
                  ? "Quote Request Submitted!"
                  : "Service Booked!"}
              </h4>
              <p
                className={`text-sm ${
                  data.purpose === "quote"
                    ? "text-amber-700"
                    : "text-emerald-700"
                }`}
              >
                Your reference number is{" "}
                <span className="font-mono font-bold tracking-wider">
                  {bookingRef}
                </span>
              </p>
              <p
                className={`mt-2 text-xs ${
                  data.purpose === "quote"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {data.purpose === "quote"
                  ? `We'll send a quote to ${data.email} shortly`
                  : `A confirmation email has been sent to ${data.email}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <SummaryCard title="Request Type">
              <SummaryRow
                label="Type"
                value={
                  data.purpose === "quote"
                    ? "Quote Request"
                    : "Service Booking"
                }
              />
            </SummaryCard>

            <SummaryCard title="Service Details">
              <SummaryRow label="Category" value={data.serviceType} />
              {data.servicePackage && (
                <SummaryRow label="Package" value={data.servicePackage} />
              )}
              {data.serviceDetails && (
                <SummaryRow label="Details" value={data.serviceDetails} />
              )}
            </SummaryCard>

            <SummaryCard title="Vehicle">
              <SummaryRow
                label="Vehicle"
                value={`${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`}
              />
              {data.vehicleReg && (
                <SummaryRow label="Registration" value={data.vehicleReg} />
              )}
            </SummaryCard>

            {data.purpose === "book" && (
              <SummaryCard title="Appointment">
                <SummaryRow label="Date" value={formatDate(data.date)} />
                <SummaryRow label="Time" value={formatTime(data.time)} />
              </SummaryCard>
            )}

            <SummaryCard title="Contact">
              <SummaryRow label="Name" value={data.name} />
              <SummaryRow label="Email" value={data.email} />
              <SummaryRow label="Phone" value={data.phone} />
            </SummaryCard>

            <InfoBanner variant="warning">
              {data.purpose === "quote" ? (
                <>
                  <strong>Please note:</strong> We aim to respond to all quote
                  requests within 24 hours.
                </>
              ) : (
                <>
                  <strong>Please note:</strong> Contact us at least 24 hours in
                  advance if you need to reschedule or cancel your appointment.
                </>
              )}
            </InfoBanner>
          </div>
        ),
      },
    ],
    [data, currentYear, submitted, bookingRef]
  );

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit({
        purpose: data.purpose,
        serviceType: data.serviceType,
        servicePackage: data.servicePackage,
        serviceDetails: data.serviceDetails,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        vehicleReg: data.vehicleReg,
        date: data.date,
        time: data.time,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      return;
    }

    if (data.purpose === "quote") {
      // ── Quote path ──────────────────────────────────────
      const payload = {
        customerInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
        serviceType: data.servicePackage
          ? `${data.serviceType} — ${data.servicePackage}`
          : data.serviceType,
        serviceDetails: data.serviceDetails || "",
        vehicle: {
          make: data.vehicleMake,
          model: data.vehicleModel,
          year: data.vehicleYear,
          registration: data.vehicleReg || undefined,
        },
      };

      const res = await fetch("/api/bookings/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to submit quote request");
      }

      setBookingRef(result.data.quoteReference);
      setSubmitted(true);
    } else {
      // ── Booking path ────────────────────────────────────
      const payload = {
        customerInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
        serviceType: data.servicePackage
          ? `${data.serviceType} — ${data.servicePackage}`
          : data.serviceType,
        serviceDetails: [
          `Vehicle: ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`,
          data.vehicleReg ? `Reg: ${data.vehicleReg}` : "",
          data.serviceDetails,
        ]
          .filter(Boolean)
          .join("\n"),
        appointmentDate: data.date,
        appointmentTime: data.time,
      };

      const res = await fetch("/api/bookings/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to book service");
      }

      setBookingRef(result.data.bookingReference);
      setSubmitted(true);
    }
  };

  // Filter out Date & Time step when purpose is "quote"
  const activeSteps = useMemo(
    () =>
      data.purpose === "quote"
        ? steps.filter((s) => s.title !== "Date & Time")
        : steps,
    [data.purpose, steps]
  );

  return (
    <Form
      steps={activeSteps}
      onSubmit={handleSubmit}
      submitLabel={data.purpose === "quote" ? "Submit Quote Request" : "Book Service"}
    />
  );
};

export default ServiceBookingForm;
