"use client";
import React from "react";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { FOCUS_RING } from "./constants";

interface DesktopSearchProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// The persistent md+ search field in the top bar.
export function DesktopSearch({
  inputRef,
  value,
  onChange,
  onSubmit,
}: DesktopSearchProps) {
  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="mx-auto hidden max-w-lg flex-1 md:flex"
    >
      <label className="sr-only" htmlFor="site-search">
        Search make or model
      </label>
      <div className="group relative flex w-full items-center">
        <span className="pointer-events-none absolute left-4 text-gray-500 transition-colors group-focus-within:text-gray-300">
          <Search size={16} />
        </span>
        <input
          id="site-search"
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search make or model…"
          className="h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.05] pr-4 pl-11 text-[14px] text-white transition-colors placeholder:text-gray-500 hover:border-white/[0.12] hover:bg-white/[0.07] focus:border-red-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/20 focus:outline-none"
        />
        <kbd className="pointer-events-none absolute right-3 hidden items-center rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-gray-500 lg:inline-flex">
          /
        </kbd>
      </div>
    </form>
  );
}

interface MobileSearchSheetProps {
  open: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

// Slide-down search sheet shown on small screens when the magnifying-glass
// trigger is tapped.
export function MobileSearchSheet({
  open,
  inputRef,
  value,
  onChange,
  onSubmit,
  onClose,
}: MobileSearchSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 460, damping: 32 }}
          className="absolute inset-x-0 top-0 z-[70] border-b border-white/[0.06] bg-[#0a0a0a] md:hidden"
        >
          <form
            role="search"
            onSubmit={onSubmit}
            className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500">
                <Search size={16} />
              </span>
              <input
                ref={inputRef}
                type="search"
                aria-label="Search make or model"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search make or model…"
                className="h-11 w-full rounded-full border border-white/[0.10] bg-white/[0.06] pr-4 pl-11 text-[14px] text-white placeholder:text-gray-500 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/25 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className={
                "inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-white/[0.08] hover:text-white " +
                FOCUS_RING
              }
            >
              <X size={20} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
