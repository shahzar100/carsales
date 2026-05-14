"use client";
import React from "react";
import { ChevronRight } from "lucide-react";

interface TitleBlockProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  prefillLabel?: string;
  onPrefillChange?: () => void;
}

export default function TitleBlock({
  eyebrow,
  title,
  subtitle,
  prefillLabel,
  onPrefillChange,
}: TitleBlockProps) {
  return (
    <div className="pt-8 pb-7 sm:pt-10">
      {prefillLabel && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700">
            <span className="bk-prefill-dot" aria-hidden="true" />
            Continuing from{" "}
            <strong className="ml-0.5 font-bold">{prefillLabel}</strong>
            {onPrefillChange && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button
                  type="button"
                  onClick={onPrefillChange}
                  className="text-red-800 underline-offset-2 hover:underline"
                >
                  change
                </button>
              </>
            )}
          </span>
        </div>
      )}
      <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-red-600 uppercase">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-600" />
        {eyebrow}
      </span>
      <h1 className="m-0 text-[28px] leading-[1.05] font-extrabold tracking-[-0.02em] text-gray-900 sm:text-[36px] lg:text-[40px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3.5 max-w-[640px] text-[15px] leading-[1.55] text-gray-600 sm:text-[17px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
