"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import { BUSINESS_NAME, FOCUS_RING } from "./constants";
import { DesktopSearch } from "./SearchBar";

interface TopBarProps {
  search: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchChange: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onMobileSearchOpen: () => void;
  onNav: (href: string, label: string) => void;
  rightCluster: React.ReactNode;
}

// Logo + centered desktop search + mobile-search trigger + Browse CTA +
// caller-supplied right cluster (account/menu buttons).
export default function TopBar({
  search,
  searchInputRef,
  onSearchChange,
  onSearchSubmit,
  onMobileSearchOpen,
  onNav,
  rightCluster,
}: TopBarProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center gap-3 sm:gap-4 md:h-[72px]">
        {/* Logo + wordmark */}
        <Link
          href="/"
          onClick={() => onNav("/", "Home")}
          aria-label={`${BUSINESS_NAME} — home`}
          className={
            "-m-1 inline-flex shrink-0 items-center gap-3 rounded-lg p-1 " +
            FOCUS_RING
          }
        >
          <Image
            src="/logo.jpeg"
            alt=""
            width={100}
            height={100}
            priority
            className="block h-11 w-11 rounded-md object-cover ring-1 ring-white/10 md:h-12 md:w-12"
          />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[15px] font-bold tracking-tight text-white">
              {BUSINESS_NAME}
            </span>
            <span className="mt-1 text-[10.5px] tracking-[0.18em] text-gray-400 uppercase">
              Car Sales &amp; Services
            </span>
          </span>
        </Link>

        {/* Center search (md+) */}
        <DesktopSearch
          inputRef={searchInputRef}
          value={search}
          onChange={onSearchChange}
          onSubmit={onSearchSubmit}
        />

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Mobile search icon */}
          <button
            type="button"
            onClick={onMobileSearchOpen}
            aria-label="Search"
            className={
              "inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white md:hidden " +
              FOCUS_RING
            }
          >
            <Search size={20} />
          </button>

          {/* Primary CTA — the viewing funnel starts at the fleet list
              (you pick a car, then book a viewing on it). Visible at all
              breakpoints. */}
          <Link
            href="/BrowseFleet"
            onClick={() => onNav("/BrowseFleet", "Browse Cars")}
            className={
              "inline-flex h-10 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-[13.5px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(220,38,38,0.6)] transition-colors hover:bg-red-700 " +
              FOCUS_RING
            }
          >
            Browse Cars
            <ArrowRight size={15} />
          </Link>

          {rightCluster}
        </div>
      </div>
    </div>
  );
}
