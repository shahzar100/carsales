"use client";
import React from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { AnimatePresence } from "motion/react";
import {
  ACCOUNT_LINKS,
  BUSINESS_NAME,
  FOCUS_RING,
  initialsOf,
} from "./constants";
import { DropdownPanel, PanelLink, SectionLabel } from "./DropdownPanel";

type SessionUser = {
  name?: string | null;
  email?: string | null;
} | null;

interface AccountMenuProps {
  open: boolean;
  user: SessionUser;
  displayName: string;
  panelId: string;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onNav: (href: string, label: string) => void;
  onLogout: () => void;
}

// Desktop account dropdown trigger + panel. Renders the avatar/initials
// pill, opens a dropdown that shows the signed-in garage links or a
// signed-out welcome with login/register CTAs.
export default function AccountMenu({
  open,
  user,
  displayName,
  panelId,
  buttonRef,
  panelRef,
  onToggle,
  onNav,
  onLogout,
}: AccountMenuProps) {
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={user ? `Account menu for ${displayName}` : "Account menu"}
        className={
          "inline-flex h-10 items-center gap-2 rounded-lg pr-2 pl-1.5 text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white sm:pr-3 sm:pl-2 " +
          (open ? "bg-white/[0.08] text-white " : "") +
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
            (open ? "rotate-180" : "")
          }
        />
      </button>

      <AnimatePresence>
        {open && (
          <DropdownPanel id={panelId} panelRef={panelRef} className="w-72">
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
                  <PanelLink key={item.href} item={item} onNav={onNav} />
                ))}
                <div className="mx-2 my-1 h-px bg-white/[0.06]" />
                <button
                  type="button"
                  onClick={onLogout}
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
                    onClick={() => onNav("/login", "Sign in")}
                    className={
                      "inline-flex h-10 items-center justify-center rounded-lg bg-red-600 text-[13.5px] font-semibold text-white transition-colors hover:bg-red-700 " +
                      FOCUS_RING
                    }
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => onNav("/register", "Create account")}
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
                  onClick={() => onNav("/contact", "Contact")}
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
  );
}
