"use client";
import React, { useState, useMemo } from "react";
import Form, { FormStep } from "../../Form/Form";
import Dropdown from "../../Form/Dropdown";
import {
  FormInput,
  FormTextarea,
  SummaryRow,
  SummaryCard,
} from "../../Form/FormPrimitives";
import { UserRound, CalendarDays, Wrench, ClipboardList } from "lucide-react";
import { BOOKING_SLOT_OPTIONS } from "@/lib/utils/bookingSlots";

// ── Form data shape ──────────────────────────────────────────
interface AppointmentFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  serviceDetails: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

const serviceTypeOptions = [
  { value: "Oil Change", label: "Oil Change" },
  { value: "Full Service", label: "Full Service" },
  { value: "MOT", label: "MOT" },
  { value: "Brake Inspection", label: "Brake Inspection" },
  { value: "Tyre Replacement", label: "Tyre Replacement" },
  { value: "Diagnostics", label: "Diagnostics" },
  { value: "Detailing", label: "Detailing" },
  { value: "Window Tint", label: "Window Tint" },
  { value: "Paint Repair", label: "Paint Repair" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Bookable time slots — shared with the customer booking flow and the
// server validator so admin-created appointments only use accepted times.
const timeSlots = BOOKING_SLOT_OPTIONS;

// ── Helpers ──────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s+()-]{7,20}$/;

const today = () => new Date().toISOString().split("T")[0];

// ═════════════════════════════════════════════════════════════
// AppointmentForm
// ═════════════════════════════════════════════════════════════
const AppointmentForm = () => {
  const [data, setData] = useState<AppointmentFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceType: "",
    serviceDetails: "",
    appointmentDate: "",
    appointmentTime: "",
    status: "pending",
  });

  const update = (field: keyof AppointmentFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const steps: FormStep[] = useMemo(
    () => [
      // ── Step 1: Customer Info ─────────────────────────────
      {
        title: "Customer Details",
        description: "Who is the appointment for?",
        icon: <UserRound className="h-5 w-5" />,
        validate: () => {
          if (!data.customerName.trim()) return "Customer name is required";
          if (!data.customerEmail.trim()) return "Email is required";
          if (!emailRegex.test(data.customerEmail))
            return "Please enter a valid email address";
          if (!data.customerPhone.trim()) return "Phone number is required";
          if (!phoneRegex.test(data.customerPhone))
            return "Please enter a valid phone number";
          return true;
        },
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              value={data.customerName}
              onChange={(v) => update("customerName", v)}
              placeholder="e.g. John Smith"
              required
            />
            <FormInput
              label="Email"
              type="email"
              value={data.customerEmail}
              onChange={(v) => update("customerEmail", v)}
              placeholder="e.g. john@example.com"
              required
            />
            <FormInput
              label="Phone"
              type="tel"
              value={data.customerPhone}
              onChange={(v) => update("customerPhone", v)}
              placeholder="e.g. 07700 900000"
              required
            />
          </div>
        ),
      },

      // ── Step 2: Service Info ──────────────────────────────
      {
        title: "Service Details",
        description: "What service is required?",
        icon: <Wrench className="h-5 w-5" />,
        validate: () => {
          if (!data.serviceType) return "Please select a service type";
          return true;
        },
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <Dropdown
              label="Service Type"
              placeholder="Select a service"
              options={serviceTypeOptions}
              value={data.serviceType}
              onChange={(v) => update("serviceType", v)}
              required
            />
            <div className="sm:col-span-2">
              <FormTextarea
                label="Additional Details (optional)"
                value={data.serviceDetails}
                onChange={(v) => update("serviceDetails", v)}
                placeholder="Any extra info about the service needed..."
                rows={3}
              />
            </div>
          </div>
        ),
      },

      // ── Step 3: Date & Time ───────────────────────────────
      {
        title: "Date & Time",
        description: "When should the appointment be?",
        icon: <CalendarDays className="h-5 w-5" />,
        validate: () => {
          if (!data.appointmentDate) return "Please select a date";
          if (data.appointmentDate < today())
            return "Date cannot be in the past";
          if (!data.appointmentTime) return "Please select a time";
          return true;
        },
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Date"
              type="date"
              value={data.appointmentDate}
              onChange={(v) => update("appointmentDate", v)}
              min={today()}
              required
            />
            <Dropdown
              label="Time"
              placeholder="Select a time slot"
              options={timeSlots}
              value={data.appointmentTime}
              onChange={(v) => update("appointmentTime", v)}
              required
            />
          </div>
        ),
      },

      // ── Step 4: Review ────────────────────────────────────
      {
        title: "Review & Submit",
        description: "Confirm the appointment details",
        icon: <ClipboardList className="h-5 w-5" />,
        validate: () => {
          if (!data.status) return "Please select a status";
          return true;
        },
        content: (
          <div className="space-y-5">
            <Dropdown
              label="Status"
              placeholder="Select status"
              options={statusOptions}
              value={data.status}
              onChange={(v) => update("status", v)}
              required
            />

            <SummaryCard>
              <SummaryRow label="Customer" value={data.customerName} />
              <SummaryRow label="Email" value={data.customerEmail} />
              <SummaryRow label="Phone" value={data.customerPhone} />
              <SummaryRow label="Service" value={data.serviceType} />
              <SummaryRow label="Details" value={data.serviceDetails || "—"} />
              <SummaryRow label="Date" value={data.appointmentDate} />
              <SummaryRow label="Time" value={data.appointmentTime} />
              <SummaryRow label="Status" value={data.status} />
            </SummaryCard>
          </div>
        ),
      },
    ],
    [data]
  );

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/bookings/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerInfo: {
            name: data.customerName,
            email: data.customerEmail,
            phone: data.customerPhone,
          },
          serviceType: data.serviceType,
          serviceDetails: data.serviceDetails,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create appointment");
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  return (
    <Form
      steps={steps}
      onSubmit={handleSubmit}
      submitLabel="Create Appointment"
    />
  );
};

export default AppointmentForm;
