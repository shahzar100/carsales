"use client";
import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Menu as MenuIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { BRANDS, FOCUS_RING, MORE, SERVICES } from "./constants";
import { DropdownPanel, PanelLink, SectionLabel } from "./DropdownPanel";

interface DesktopMenuProps {
  open: boolean;
  mobileOpen: boolean;
  panelId: string;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onTrigger: () => void;
  onNav: (href: string, label: string) => void;
}

// Desktop "Menu" trigger + dropdown panel. On <md viewports the trigger
// instead opens the full-screen MobileMenu overlay; that branching is
// decided by `onTrigger` in the orchestrator so we can keep the markup
// here purely about the desktop panel.
export default function DesktopMenu({
  open,
  mobileOpen,
  panelId,
  buttonRef,
  panelRef,
  onTrigger,
  onNav,
}: DesktopMenuProps) {
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onTrigger}
        aria-haspopup="menu"
        aria-expanded={open || mobileOpen}
        aria-controls={panelId}
        aria-label="Main menu"
        className={
          "inline-flex h-10 items-center gap-2 rounded-lg pr-2 pl-2.5 text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white sm:pr-3 sm:pl-3 " +
          (open ? "bg-white/[0.08] text-white " : "") +
          FOCUS_RING
        }
      >
        <MenuIcon size={18} />
        <span className="hidden text-[13px] font-medium sm:inline">Menu</span>
        <ChevronDown
          size={14}
          className={
            "hidden text-gray-400 transition-transform md:block " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      <AnimatePresence>
        {open && (
          <DropdownPanel
            id={panelId}
            panelRef={panelRef}
            className="w-[560px] max-w-[calc(100vw-2rem)]"
          >
            <div className="grid grid-cols-2 gap-1 p-1">
              {/* Left column */}
              <div>
                <SectionLabel>Browse Fleet</SectionLabel>
                <Link
                  href="/BrowseFleet"
                  onClick={() => onNav("/BrowseFleet", "Browse Fleet")}
                  className={
                    "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.06] " +
                    FOCUS_RING
                  }
                >
                  <span className="font-semibold">All vehicles</span>
                  <ArrowRight
                    size={14}
                    className="text-red-400 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
                <div className="mt-1 border-t border-white/[0.05] pt-1">
                  <SectionLabel>By brand</SectionLabel>
                  <div className="grid grid-cols-2 gap-0.5">
                    {BRANDS.map((b) => (
                      <Link
                        key={b.label}
                        href={b.href}
                        onClick={() => onNav(b.href, b.label)}
                        className={
                          "rounded-md px-3 py-2 text-[13px] text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white " +
                          FOCUS_RING
                        }
                      >
                        {b.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="mt-1 border-t border-white/[0.05] pt-1">
                  <SectionLabel>Services</SectionLabel>
                  <div className="grid grid-cols-1 gap-0.5">
                    {SERVICES.map((s) => (
                      <Link
                        key={s.label}
                        href={s.href}
                        onClick={() => onNav(s.href, s.label)}
                        className={
                          "rounded-md px-3 py-2 text-[13px] text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white " +
                          FOCUS_RING
                        }
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col">
                <SectionLabel>More</SectionLabel>
                <div className="flex flex-col gap-0.5">
                  {MORE.map((item) => (
                    <PanelLink key={item.href} item={item} onNav={onNav} />
                  ))}
                </div>
                <div className="mt-auto p-2">
                  <Link
                    href="/BrowseFleet"
                    onClick={() => onNav("/BrowseFleet", "Browse Cars")}
                    className={
                      "group flex items-center justify-between rounded-lg bg-gradient-to-br from-red-600 to-red-700 p-3 transition-colors hover:from-red-500 hover:to-red-600 " +
                      FOCUS_RING
                    }
                  >
                    <span className="text-white">
                      <span className="block text-[13px] font-bold">
                        Browse our cars
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-red-100/80">
                        7 days, no pressure
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-white transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </DropdownPanel>
        )}
      </AnimatePresence>
    </div>
  );
}
