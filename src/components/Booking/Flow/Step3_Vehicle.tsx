"use client";
import React from "react";
import { ArrowRight } from "lucide-react";
import TitleBlock from "./TitleBlock";
import {
  FormInput,
  FormTextarea,
  InfoBanner,
} from "../../Form/FormPrimitives";
import type { BookingState, UpdateFn } from "./bookingFlowTypes";

interface Step3VehicleProps {
  data: BookingState;
  update: UpdateFn;
  currentYear: number;
  onContinue: () => void;
  error: string | null;
}

// Step 3 — collect vehicle make/model/year/reg + free-form notes.
// Validation lives in the orchestrator; this view only renders inputs
// and forwards changes via the `update` callback.
export default function Step3Vehicle({
  data,
  update,
  currentYear,
  onContinue,
  error,
}: Step3VehicleProps) {
  return (
    <>
      <TitleBlock
        eyebrow="Step 3 · Vehicle"
        title={
          <>
            Tell us about <span className="text-red-600">your car</span>
          </>
        }
        subtitle="A few details so we can prepare the right parts and products before you arrive."
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
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

          <div className="mt-4">
            <FormTextarea
              label="Anything else we should know? (optional)"
              value={data.serviceDetails}
              onChange={(v) => update("serviceDetails", v)}
              placeholder="Describe any issue, area of concern, or special request..."
              rows={3}
            />
          </div>

          <div className="mt-5">
            <InfoBanner variant="info">
              Providing your registration plate helps us prepare the correct
              parts and materials before your appointment.
            </InfoBanner>
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
