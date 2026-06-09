"use client";
import React from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import TitleBlock from "./TitleBlock";
import {
  FormInput,
  InfoBanner,
  SummaryCard,
  SummaryRow,
} from "../../Form/FormPrimitives";
import TurnstileWidget from "../../Form/TurnstileWidget";
import { formatDate } from "@/lib/utils/format";
import type { BookingState, UpdateFn } from "./bookingFlowTypes";

interface Step5ConfirmProps {
  data: BookingState;
  update: UpdateFn;
  service: string;
  packageName: string;
  packagePrice: string;
  onSubmit: () => void;
  submitting: boolean;
  submitted: boolean;
  bookingRef: string;
  setTurnstileToken: (t: string) => void;
  error: string | null;
  onReturnHome: () => void;
}

// Step 5 — contact details + review + submit. When `submitted` is true
// the step swaps in a success card showing the booking/quote reference
// and a "Track booking" / "Back to home" pair.
export default function Step5Confirm({
  data,
  update,
  service,
  packageName,
  packagePrice,
  onSubmit,
  submitting,
  submitted,
  bookingRef,
  setTurnstileToken,
  error,
  onReturnHome,
}: Step5ConfirmProps) {
  if (submitted) {
    return <SuccessView data={data} bookingRef={bookingRef} onReturnHome={onReturnHome} />;
  }

  return (
    <>
      <TitleBlock
        eyebrow="Step 5 · Confirm"
        title={
          <>
            Your <span className="text-red-600">contact details</span>
          </>
        }
        subtitle="We'll send the confirmation and any updates to the email and phone you provide."
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              value={data.name}
              onChange={(v) => update("name", v)}
              placeholder="e.g. John Smith"
              autoComplete="name"
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
                Your booking is linked to your account email.
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

          <div className="space-y-3">
            <SummaryCard title="Service">
              <SummaryRow label="Type" value={service} />
              <SummaryRow
                label="Package"
                value={`${packageName} · ${packagePrice}`}
              />
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

            {data.purpose === "book" && data.date && data.time && (
              <SummaryCard title="Appointment">
                <SummaryRow label="Date" value={formatDate(data.date, "long")} />
                <SummaryRow label="Time" value={data.time} />
              </SummaryCard>
            )}
          </div>

          <div className="mt-4">
            <TurnstileWidget onToken={setTurnstileToken} />
          </div>

          <div className="mt-4">
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

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="mt-6 flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>Submitting…</>
              ) : (
                <>
                  {data.purpose === "quote"
                    ? "Submit Quote Request"
                    : "Confirm Booking"}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Success screen ──────────────────────────────────────────
function SuccessView({
  data,
  bookingRef,
  onReturnHome,
}: {
  data: BookingState;
  bookingRef: string;
  onReturnHome: () => void;
}) {
  return (
    <>
      <TitleBlock
        eyebrow="Step 5 · Confirm"
        title={
          data.purpose === "quote" ? (
            <>
              Quote request <span className="text-red-600">sent</span>
            </>
          ) : (
            <>
              Booking <span className="text-red-600">confirmed</span>
            </>
          )
        }
      />

      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-2xl border-2 p-6 text-center sm:p-10 ${
            data.purpose === "quote"
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <CheckCircle
            className={`mx-auto mb-3 h-14 w-14 ${
              data.purpose === "quote" ? "text-amber-500" : "text-emerald-500"
            }`}
          />
          <h4
            className={`mb-1 text-lg font-bold ${
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
              ? `We'll send a quote to ${data.email} shortly.`
              : `A confirmation email has been sent to ${data.email}.`}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`/Booking/lookup?ref=${bookingRef}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
            >
              Track booking
            </a>
            <button
              type="button"
              onClick={onReturnHome}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
