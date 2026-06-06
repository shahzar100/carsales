"use client";
import React from "react";
import { m } from "motion/react";
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
        <m.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4"
        >
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
        </m.div>
      )}
      <m.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-red-600 uppercase"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-600" />
        {eyebrow}
      </m.span>
      <m.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        className="m-0 text-[28px] leading-[1.05] font-extrabold tracking-[-0.02em] text-gray-900 sm:text-[36px] lg:text-[40px]"
      >
        {title}
      </m.h1>
      {subtitle && (
        <m.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
          className="mt-3.5 max-w-[640px] text-[15px] leading-[1.55] text-gray-600 sm:text-[17px]"
        >
          {subtitle}
        </m.p>
      )}
    </div>
  );
}
