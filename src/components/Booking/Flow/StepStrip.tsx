"use client";
import React from "react";
import { m } from "motion/react";
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
            <m.button
              type="button"
              onClick={onBack}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 20 }}
              className="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </m.button>
          )}
          <div className="flex flex-col gap-[2px]">
            <span className="text-[11px] font-bold tracking-[0.1em] text-gray-400 uppercase">
              Step{" "}
              <m.span
                key={step}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block tabular-nums"
              >
                {step}
              </m.span>{" "}
              of {total}
            </span>
            <m.span
              key={title}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[13px] font-medium text-gray-700"
            >
              {title}
            </m.span>
          </div>
          <div className="ml-auto flex w-full items-center gap-1.5 sm:w-auto sm:gap-1.5">
            {Array.from({ length: total }).map((_, i) => {
              const cls =
                i + 1 < step ? "done" : i + 1 === step ? "now" : "";
              const isCurrent = i + 1 === step;
              return (
                <m.span
                  key={i}
                  className={`bk-step-dot ${cls}`.trim()}
                  animate={{
                    scale: isCurrent ? 1.3 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 460, damping: 22 }}
                />
              );
            })}
            <span className="ml-2 hidden text-[12px] font-semibold text-gray-600 tabular-nums sm:inline">
              <m.span
                key={step}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                {step}
              </m.span>
              /{total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
