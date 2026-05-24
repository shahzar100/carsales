"use client";
import React from "react";
import { ArrowRight, CalendarCheck, MessageSquareQuote } from "lucide-react";
import TitleBlock from "./TitleBlock";
import Dropdown from "../../Form/Dropdown";
import { FormInput, InfoBanner } from "../../Form/FormPrimitives";
import { formatDate } from "@/lib/utils/format";
import {
  TIME_SLOTS,
  maxDate,
  today,
  type BookingState,
  type UpdateFn,
} from "./bookingFlowTypes";

interface Step4ScheduleProps {
  data: BookingState;
  update: UpdateFn;
  onContinue: () => void;
  onTogglePurpose: (p: "book" | "quote") => void;
  error: string | null;
}

// Step 4 — date/time selection (for the "book" path) or a notice that
// no scheduling is needed (for the "quote" path). The purpose toggle is
// rendered here but the actual reset of date/time when switching purpose
// is handled by the orchestrator via `onTogglePurpose`.
export default function Step4Schedule({
  data,
  update,
  onContinue,
  onTogglePurpose,
  error,
}: Step4ScheduleProps) {
  return (
    <>
      <TitleBlock
        eyebrow="Step 4 · Schedule"
        title={
          data.purpose === "quote" ? (
            <>
              Get a <span className="text-red-600">written quote</span>
            </>
          ) : (
            <>
              Pick a <span className="text-red-600">slot</span>
            </>
          )
        }
        subtitle={
          data.purpose === "quote"
            ? "We'll get a written quote back to you within one business day."
            : "Most appointments confirmed within the hour during workshop hours."
        }
      />

      <div className="mx-auto max-w-2xl">
        {/* Purpose toggle — Book vs Quote */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onTogglePurpose("book")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              data.purpose === "book"
                ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            Book a slot
          </button>
          <button
            type="button"
            onClick={() => onTogglePurpose("quote")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              data.purpose === "quote"
                ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <MessageSquareQuote className="h-4 w-4" />
            Get a quote
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          {data.purpose === "book" ? (
            <>
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
                  options={TIME_SLOTS}
                  value={data.time}
                  onChange={(v) => update("time", v)}
                  required
                />
              </div>
              {data.date && data.time && (
                <div className="mt-4">
                  <InfoBanner variant="info">
                    <strong>Your appointment:</strong>{" "}
                    {formatDate(data.date, "long")} at {data.time}.
                  </InfoBanner>
                </div>
              )}
            </>
          ) : (
            <InfoBanner variant="info">
              No date needed — just hop to the next step with your contact
              details and we&apos;ll come back with a written quote.
            </InfoBanner>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
            >
              Continue to contact
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
