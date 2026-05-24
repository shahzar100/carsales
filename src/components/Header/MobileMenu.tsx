"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  LogOut,
  Search,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  ACCOUNT_LINKS,
  BRANDS,
  BUSINESS_NAME,
  FOCUS_RING,
  MORE,
  SERVICES,
  initialsOf,
} from "./constants";

type SessionUser = {
  name?: string | null;
  email?: string | null;
} | null;

interface MobileMenuProps {
  open: boolean;
  user: SessionUser;
  displayName: string;
  search: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onNav: (href: string, label: string) => void;
  onLogout: () => void;
}

// Full-screen mobile menu overlay (<md viewports). Renders the brand
// header, an inline search, all menu groups, the account block, and a
// sticky bottom CTA.
export default function MobileMenu({
  open,
  user,
  displayName,
  search,
  onSearchChange,
  onSearchSubmit,
  onClose,
  onNav,
  onLogout,
}: MobileMenuProps) {
  return (
    <AnimatePresence>
      {open && (
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
                onClick={() => onNav("/", "Home")}
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
                onClick={onClose}
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
              <form role="search" onSubmit={onSearchSubmit}>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500">
                    <Search size={16} />
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
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
                  onNav={onNav}
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
                      onNav={onNav}
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
                    onNav={onNav}
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
                      onNav={onNav}
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
                          onNav={onNav}
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
                      onClick={onLogout}
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
                      onClick={() => onNav("/login", "Sign in")}
                      className={
                        "inline-flex h-12 items-center justify-center rounded-lg bg-red-600 text-[14px] font-semibold text-white transition-colors hover:bg-red-700 " +
                        FOCUS_RING
                      }
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => onNav("/register", "Create account")}
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
                href="/BrowseFleet"
                onClick={() => onNav("/BrowseFleet", "Browse Cars")}
                className={
                  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-[15px] font-semibold text-white transition-colors hover:bg-red-700 " +
                  FOCUS_RING
                }
              >
                Browse Cars
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
  );
}

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
