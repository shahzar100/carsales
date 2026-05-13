"use client";
import React from "react";
import { ChevronLeft } from "lucide-react";

export const STEP_LABELS = [
  "Service",
  "Package",
  "Vehicle",
  "Date & Time",
  "Confirm",
] as const;

interface StepStripProps {
  step: number;
  total?: number;
  title: string;
  onBack?: () => void;
}

export default function StepStrip({
  step,
  total = STEP_LABELS.length,
  title,
  onBack,
}: StepStripProps) {
  return (
    <div className="border-b border-gray-200 bg-gray-50 py-4 sm:py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          <div className="flex flex-col gap-[2px]">
            <span className="text-[11px] font-bold tracking-[0.1em] text-gray-400 uppercase">
              Step {step} of {total}
            </span>
            <span className="text-[13px] font-medium text-gray-700">
              {title}
            </span>
          </div>
          <div className="ml-auto flex w-full items-center gap-1.5 sm:w-auto sm:gap-1.5">
            {Array.from({ length: total }).map((_, i) => {
              const cls =
                i + 1 < step ? "done" : i + 1 === step ? "now" : "";
              return <span key={i} className={`bk-step-dot ${cls}`.trim()} />;
            })}
            <span className="ml-2 hidden text-[12px] font-semibold text-gray-600 tabular-nums sm:inline">
              {step}/{total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
