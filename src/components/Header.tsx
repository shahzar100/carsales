"use client";

/**
 * Header — Morley Motors site header.
 *
 * Dark + red premium dealership header, implemented from the Claude
 * Design handoff bundle and wired into the real app:
 *   - nav links point at the actual marketing routes
 *   - search submits to /BrowseFleet?search=… (same contract as SearchBar)
 *   - the Account panel reads the customer session via next-auth and
 *     surfaces the signed-in "garage" (Saved cars / bookings); signed-out
 *     it offers Log in / Create account
 *   - link clicks feed NavigationContext so PageLoader shows during route
 *     changes, matching the old NavLink behaviour
 *
 * Desktop: Account + Menu open as click dropdowns, mutually exclusive,
 * close on outside-click and Escape. Mobile (<768px): search collapses to
 * an icon → sheet, Menu opens a full-screen overlay with body scroll lock.
 */

import { useState, useEffect, useRef, useCallback, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  User,
  Menu as MenuIcon,
  ChevronDown,
  X,
  Heart,
  Calendar,
  Clock,
  Settings as SettingsIcon,
  LogOut,
  ArrowRight,
  Shield,
  Truck,
  Package,
  Info,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useNavigation } from "@/contexts/NavigationContext";

const BUSINESS_NAME =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

type OpenPanel = "account" | "menu" | null;

type LinkItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  desc?: string;
};

// ── Menu data — real marketing routes ──────────────────────────────────
const BRANDS: LinkItem[] = [
  { label: "Toyota", href: "/BrowseFleet?make=Toyota" },
  { label: "Honda", href: "/BrowseFleet?make=Honda" },
  { label: "BMW", href: "/BrowseFleet?make=BMW" },
  { label: "Audi", href: "/BrowseFleet?make=Audi" },
];

const SERVICES: LinkItem[] = [
  { label: "Detailing", href: "/Services/Detailing" },
  { label: "Tints", href: "/Services/Tints" },
  { label: "Repairs", href: "/Services/Repairs" },
];

const MORE: LinkItem[] = [
  {
    label: "Car Parts",
    href: "/CarParts",
    icon: Package,
    desc: "OEM & aftermarket",
  },
  {
    label: "Breakdown Recovery",
    href: "/Recoveries",
    icon: Truck,
    desc: "Round-the-clock recovery",
  },
  {
    label: "Accident Claims",
    href: "/AccidentClaims",
    icon: Shield,
    desc: "We handle the paperwork",
  },
  {
    label: "Track Booking",
    href: "/Booking/lookup",
    icon: Calendar,
    desc: "Check your viewing or service",
  },
  { label: "About Us", href: "/AboutUs", icon: Info },
];

const ACCOUNT_LINKS: LinkItem[] = [
  { label: "Saved cars", href: "/account?tab=saved", icon: Heart },
  { label: "My bookings", href: "/account?tab=upcoming", icon: Calendar },
  { label: "Booking history", href: "/account?tab=history", icon: Clock },
  { label: "Account settings", href: "/account?tab=settings", icon: SettingsIcon },
];

// ── Small primitives ───────────────────────────────────────────────────
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">
      {children}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setIsNavigating, setNavigationTarget } = useNavigation();

  const user = session?.user ?? null;
  const displayName = user?.name?.trim() || user?.email || "";

  const [open, setOpen] = useState<OpenPanel>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [search, setSearch] = useState("");

  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const accountPanelRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const accountPanelId = useId();
  const menuPanelId = useId();

  // Body scroll lock while the mobile overlay is open — shared hook so it
  // cooperates with Modal/ConfirmDialog overlays.
  useScrollLock(mobileOpen);

  // Close-on-outside-click for the desktop dropdowns.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      const insideTrigger =
        accountBtnRef.current?.contains(t) || menuBtnRef.current?.contains(t);
      const insidePanel =
        accountPanelRef.current?.contains(t) ||
        menuPanelRef.current?.contains(t);
      if (!insideTrigger && !insidePanel) setOpen(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Escape closes whatever is open and restores focus to the trigger.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (mobileOpen) return setMobileOpen(false);
      if (mobileSearch) return setMobileSearch(false);
      if (open === "account") {
        setOpen(null);
        accountBtnRef.current?.focus();
      } else if (open === "menu") {
        setOpen(null);
        menuBtnRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, mobileOpen, mobileSearch]);

  // "/" focuses the desktop search, unless the user is already typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Autofocus the mobile search input when its sheet opens.
  useEffect(() => {
    if (mobileSearch) mobileSearchInputRef.current?.focus();
  }, [mobileSearch]);

  // Opening one panel closes the other.
  const toggle = useCallback((which: Exclude<OpenPanel, null>) => {
    setOpen((cur) => (cur === which ? null : which));
  }, []);

  const closeAll = useCallback(() => {
    setOpen(null);
    setMobileOpen(false);
    setMobileSearch(false);
  }, []);

  // Mirror the old NavLink behaviour: feed NavigationContext so PageLoader
  // shows while the route change is in flight.
  const handleNav = useCallback(
    (href: string, label: string) => {
      closeAll();
      if (href !== pathname) {
        setIsNavigating(true);
        setNavigationTarget(label);
      }
    },
    [closeAll, pathname, setIsNavigating, setNavigationTarget]
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    closeAll();
    router.push(
      trimmed
        ? `/BrowseFleet?search=${encodeURIComponent(trimmed)}`
        : "/BrowseFleet"
    );
  };

  const handleLogout = () => {
    closeAll();
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-[60] border-b border-white/[0.06] bg-[#0a0a0a]/95 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3 sm:gap-4 md:h-[72px]">
          {/* Logo + wordmark */}
          <Link
            href="/"
            onClick={() => handleNav("/", "Home")}
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
          <form
            role="search"
            onSubmit={submitSearch}
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
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search make or model…"
                className="h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.05] pr-4 pl-11 text-[14px] text-white transition-colors placeholder:text-gray-500 hover:border-white/[0.12] hover:bg-white/[0.07] focus:border-red-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/20 focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-3 hidden items-center rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-gray-500 lg:inline-flex">
                /
              </kbd>
            </div>
          </form>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Mobile search icon */}
            <button
              type="button"
              onClick={() => setMobileSearch(true)}
              aria-label="Search"
              className={
                "inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white md:hidden " +
                FOCUS_RING
              }
            >
              <Search size={20} />
            </button>

            {/* Primary CTA */}
            <Link
              href="/Book"
              onClick={() => handleNav("/Book", "Book a Viewing")}
              className={
                "hidden h-10 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-[13.5px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(220,38,38,0.6)] transition-colors hover:bg-red-700 sm:inline-flex " +
                FOCUS_RING
              }
            >
              Book a Viewing
              <ArrowRight size={15} />
            </Link>

            {/* Account */}
            <div className="relative">
              <button
                ref={accountBtnRef}
                type="button"
                onClick={() => toggle("account")}
                aria-haspopup="menu"
                aria-expanded={open === "account"}
                aria-controls={accountPanelId}
                aria-label={
                  user ? `Account menu for ${displayName}` : "Account menu"
                }
                className={
                  "inline-flex h-10 items-center gap-2 rounded-lg pr-2 pl-1.5 text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white sm:pr-3 sm:pl-2 " +
                  (open === "account" ? "bg-white/[0.08] text-white " : "") +
                  FOCUS_RING
                }
              >
                {user ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-[11px] font-bold text-white ring-1 ring-white/10">
                    {initialsOf(displayName) || <User size={16} />}
                  </span>
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
                    <User size={18} />
                  </span>
                )}
                <span className="hidden text-[13px] font-medium lg:inline">
                  {user ? displayName.split(/\s+/)[0] : "Account"}
                </span>
                <ChevronDown
                  size={14}
                  className={
                    "hidden text-gray-400 transition-transform sm:block " +
                    (open === "account" ? "rotate-180" : "")
                  }
                />
              </button>

              <AnimatePresence>
              {open === "account" && (
                <DropdownPanel
                  id={accountPanelId}
                  panelRef={accountPanelRef}
                  className="w-72"
                >
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 pt-3 pb-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-[13px] font-bold text-white ring-1 ring-white/10">
                          {initialsOf(displayName) || <User size={18} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-semibold text-white">
                            {user.name || "Your account"}
                          </span>
                          {user.email && (
                            <span className="block truncate text-[12px] text-gray-500">
                              {user.email}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mx-2 h-px bg-white/[0.06]" />
                      <SectionLabel>My Garage</SectionLabel>
                      {ACCOUNT_LINKS.map((item) => (
                        <PanelLink
                          key={item.href}
                          item={item}
                          onNav={handleNav}
                        />
                      ))}
                      <div className="mx-2 my-1 h-px bg-white/[0.06]" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white " +
                          FOCUS_RING
                        }
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.04] text-gray-400">
                          <LogOut size={16} />
                        </span>
                        <span className="font-medium">Log out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-3 pt-3 pb-1">
                        <div className="text-[14px] font-semibold text-white">
                          Welcome to {BUSINESS_NAME}
                        </div>
                        <div className="mt-0.5 text-[12.5px] text-gray-500">
                          Sign in to save cars and track bookings.
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 p-2 pt-3">
                        <Link
                          href="/login"
                          onClick={() => handleNav("/login", "Sign in")}
                          className={
                            "inline-flex h-10 items-center justify-center rounded-lg bg-red-600 text-[13.5px] font-semibold text-white transition-colors hover:bg-red-700 " +
                            FOCUS_RING
                          }
                        >
                          Log in
                        </Link>
                        <Link
                          href="/register"
                          onClick={() =>
                            handleNav("/register", "Create account")
                          }
                          className={
                            "inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-[13.5px] font-semibold text-white transition-colors hover:bg-white/[0.10] " +
                            FOCUS_RING
                          }
                        >
                          Create account
                        </Link>
                      </div>
                      <div className="mx-2 mt-2 h-px bg-white/[0.06]" />
                      <Link
                        href="/contact"
                        onClick={() => handleNav("/contact", "Contact")}
                        className={
                          "block px-3 py-2.5 text-[12.5px] text-gray-500 transition-colors hover:text-gray-300 " +
                          FOCUS_RING
                        }
                      >
                        Need help signing in?
                      </Link>
                    </>
                  )}
                </DropdownPanel>
              )}
              </AnimatePresence>
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                ref={menuBtnRef}
                type="button"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.matchMedia("(max-width: 767px)").matches
                  ) {
                    setMobileOpen(true);
                    setOpen(null);
                  } else {
                    toggle("menu");
                  }
                }}
                aria-haspopup="menu"
                aria-expanded={open === "menu" || mobileOpen}
                aria-controls={menuPanelId}
                aria-label="Main menu"
                className={
                  "inline-flex h-10 items-center gap-2 rounded-lg pr-2 pl-2.5 text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white sm:pr-3 sm:pl-3 " +
                  (open === "menu" ? "bg-white/[0.08] text-white " : "") +
                  FOCUS_RING
                }
              >
                <MenuIcon size={18} />
                <span className="hidden text-[13px] font-medium sm:inline">
                  Menu
                </span>
                <ChevronDown
                  size={14}
                  className={
                    "hidden text-gray-400 transition-transform md:block " +
                    (open === "menu" ? "rotate-180" : "")
                  }
                />
              </button>

              <AnimatePresence>
              {open === "menu" && (
                <DropdownPanel
                  id={menuPanelId}
                  panelRef={menuPanelRef}
                  className="w-[560px] max-w-[calc(100vw-2rem)]"
                >
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {/* Left column */}
                    <div>
                      <SectionLabel>Browse Fleet</SectionLabel>
                      <Link
                        href="/BrowseFleet"
                        onClick={() =>
                          handleNav("/BrowseFleet", "Browse Fleet")
                        }
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
                              onClick={() => handleNav(b.href, b.label)}
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
                              onClick={() => handleNav(s.href, s.label)}
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
                          <PanelLink
                            key={item.href}
                            item={item}
                            onNav={handleNav}
                          />
                        ))}
                      </div>
                      <div className="mt-auto p-2">
                        <Link
                          href="/Book"
                          onClick={() => handleNav("/Book", "Book a Viewing")}
                          className={
                            "group flex items-center justify-between rounded-lg bg-gradient-to-br from-red-600 to-red-700 p-3 transition-colors hover:from-red-500 hover:to-red-600 " +
                            FOCUS_RING
                          }
                        >
                          <span className="text-white">
                            <span className="block text-[13px] font-bold">
                              Book a viewing
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
          </div>
        </div>
      </div>

      {/* ── Mobile search sheet ── */}
      <AnimatePresence>
      {mobileSearch && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 460, damping: 32 }}
          className="absolute inset-x-0 top-0 z-[70] border-b border-white/[0.06] bg-[#0a0a0a] md:hidden"
        >
          <form
            role="search"
            onSubmit={submitSearch}
            className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500">
                <Search size={16} />
              </span>
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search make or model…"
                className="h-11 w-full rounded-full border border-white/[0.10] bg-white/[0.06] pr-4 pl-11 text-[14px] text-white placeholder:text-gray-500 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/25 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearch(false)}
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

      {/* ── Mobile menu overlay ── */}
      <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", stiffness: 360, damping: 36 }}
          className="fixed inset-0 z-[80] flex flex-col bg-[#0a0a0a] text-white md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          <div className="border-b border-white/[0.06]">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
              <Link
                href="/"
                onClick={() => handleNav("/", "Home")}
                className={"inline-flex items-center gap-3 " + FOCUS_RING}
                aria-label={`${BUSINESS_NAME} — home`}
              >
                <Image
                  src="/logo.jpeg"
                  alt=""
                  width={100}
                  height={100}
                  className="h-10 w-10 rounded-md object-cover ring-1 ring-white/10"
                />
                <span className="text-[15px] font-bold tracking-tight">
                  {BUSINESS_NAME}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className={
                  "inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-white/[0.08] hover:text-white " +
                  FOCUS_RING
                }
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
              {/* Inline search */}
              <form role="search" onSubmit={submitSearch}>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500">
                    <Search size={16} />
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search make or model…"
                    className="h-12 w-full rounded-full border border-white/[0.10] bg-white/[0.06] pr-4 pl-11 text-[15px] text-white placeholder:text-gray-500 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/25 focus:outline-none"
                  />
                </div>
              </form>

              {/* Browse Fleet */}
              <MobileGroup label="Browse Fleet">
                <MobileLink
                  href="/BrowseFleet"
                  label="Browse Fleet"
                  onNav={handleNav}
                  primary
                >
                  All vehicles
                </MobileLink>
                <div className="px-1 pt-2 pb-1 text-[10.5px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
                  By brand
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {BRANDS.map((b) => (
                    <MobileLink
                      key={b.label}
                      href={b.href}
                      label={b.label}
                      onNav={handleNav}
                    >
                      {b.label}
                    </MobileLink>
                  ))}
                </div>
              </MobileGroup>

              <MobileGroup label="Services">
                {SERVICES.map((s) => (
                  <MobileLink
                    key={s.label}
                    href={s.href}
                    label={s.label}
                    onNav={handleNav}
                  >
                    {s.label}
                  </MobileLink>
                ))}
              </MobileGroup>

              <MobileGroup label="More">
                {MORE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      onNav={handleNav}
                    >
                      {Icon && <Icon size={18} className="text-red-400" />}
                      <span>{item.label}</span>
                    </MobileLink>
                  );
                })}
              </MobileGroup>

              {/* Account block */}
              <div className="border-t border-white/[0.06] pt-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-1 py-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-[13px] font-bold text-white ring-1 ring-white/10">
                        {initialsOf(displayName) || <User size={18} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold">
                          {user.name || "Your account"}
                        </span>
                        {user.email && (
                          <span className="block truncate text-[12.5px] text-gray-500">
                            {user.email}
                          </span>
                        )}
                      </span>
                    </div>
                    {ACCOUNT_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <MobileLink
                          key={item.href}
                          href={item.href}
                          label={item.label}
                          onNav={handleNav}
                        >
                          {Icon && (
                            <Icon size={18} className="text-red-400" />
                          )}
                          {item.label}
                        </MobileLink>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={
                        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[15px] text-gray-200 transition-colors hover:bg-white/[0.06] " +
                        FOCUS_RING
                      }
                    >
                      <LogOut size={18} className="text-gray-400" /> Log out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 px-1">
                    <Link
                      href="/login"
                      onClick={() => handleNav("/login", "Sign in")}
                      className={
                        "inline-flex h-12 items-center justify-center rounded-lg bg-red-600 text-[14px] font-semibold text-white transition-colors hover:bg-red-700 " +
                        FOCUS_RING
                      }
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => handleNav("/register", "Create account")}
                      className={
                        "inline-flex h-12 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.10] " +
                        FOCUS_RING
                      }
                    >
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky bottom CTA */}
          <div className="border-t border-white/[0.06] bg-[#0a0a0a]">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <Link
                href="/Book"
                onClick={() => handleNav("/Book", "Book a Viewing")}
                className={
                  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-[15px] font-semibold text-white transition-colors hover:bg-red-700 " +
                  FOCUS_RING
                }
              >
                Book a Viewing
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}

// ── Reusable desktop dropdown panel ────────────────────────────────────
function DropdownPanel({
  id,
  panelRef,
  className = "",
  children,
}: {
  id?: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      ref={panelRef}
      id={id}
      role="menu"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 480, damping: 30, mass: 0.6 }}
      className={
        "absolute top-full right-0 z-50 mt-2 origin-top-right rounded-xl border border-white/[0.08] bg-[#171717] p-1 shadow-2xl shadow-black/60 ring-1 ring-black/20 " +
        className
      }
    >
      {children}
    </motion.div>
  );
}

// ── Desktop panel link (icon + label + optional description) ───────────
function PanelLink({
  item,
  onNav,
}: {
  item: LinkItem;
  onNav: (href: string, label: string) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={() => onNav(item.href, item.label)}
      className={
        "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white " +
        FOCUS_RING
      }
    >
      {Icon && (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.04] text-red-400 transition-colors group-hover:bg-red-500/10">
          <Icon size={16} />
        </span>
      )}
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block leading-tight font-medium">{item.label}</span>
        {item.desc && (
          <span className="mt-0.5 block text-[12px] leading-snug text-gray-500 group-hover:text-gray-400">
            {item.desc}
          </span>
        )}
      </span>
    </Link>
  );
}

// ── Mobile overlay pieces ──────────────────────────────────────────────
function MobileGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="px-1 pb-2 text-[11px] font-semibold tracking-[0.14em] text-gray-500 uppercase">
        {label}
      </h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

function MobileLink({
  href,
  label,
  onNav,
  primary = false,
  children,
}: {
  href: string;
  label: string;
  onNav: (href: string, label: string) => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => onNav(href, label)}
      className={
        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[15px] transition-colors hover:bg-white/[0.06] active:bg-white/[0.08] " +
        (primary ? "font-semibold text-white " : "text-gray-200 ") +
        FOCUS_RING
      }
    >
      {children}
    </Link>
  );
}
