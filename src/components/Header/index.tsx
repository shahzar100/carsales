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
 *
 * This file is the orchestrator — it owns all UI state (which panel is
 * open, search text, refs for outside-click / focus-restoration) and
 * delegates the actual markup to focused sibling components.
 */

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useNavigation } from "@/contexts/NavigationContext";
import { type OpenPanel } from "./constants";
import TopBar from "./TopBar";
import AccountMenu from "./AccountMenu";
import DesktopMenu from "./DesktopMenu";
import { MobileSearchSheet } from "./SearchBar";
import MobileMenu from "./MobileMenu";

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

  const submitSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
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

  const handleMenuTrigger = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      setMobileOpen(true);
      setOpen(null);
    } else {
      toggle("menu");
    }
  };

  return (
    <header className="sticky top-0 z-60 border-b border-white/6 bg-[#0a0a0a]/95 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <TopBar
        search={search}
        searchInputRef={searchInputRef}
        onSearchChange={setSearch}
        onSearchSubmit={submitSearch}
        onMobileSearchOpen={() => setMobileSearch(true)}
        onNav={handleNav}
        rightCluster={
          <>
            <AccountMenu
              open={open === "account"}
              user={user}
              displayName={displayName}
              panelId={accountPanelId}
              buttonRef={accountBtnRef}
              panelRef={accountPanelRef}
              onToggle={() => toggle("account")}
              onNav={handleNav}
              onLogout={handleLogout}
            />
            <DesktopMenu
              open={open === "menu"}
              mobileOpen={mobileOpen}
              panelId={menuPanelId}
              buttonRef={menuBtnRef}
              panelRef={menuPanelRef}
              onTrigger={handleMenuTrigger}
              onNav={handleNav}
            />
          </>
        }
      />

      <MobileSearchSheet
        open={mobileSearch}
        inputRef={mobileSearchInputRef}
        value={search}
        onChange={setSearch}
        onSubmit={submitSearch}
        onClose={() => setMobileSearch(false)}
      />

      <MobileMenu
        open={mobileOpen}
        user={user}
        displayName={displayName}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={submitSearch}
        onClose={() => setMobileOpen(false)}
        onNav={handleNav}
        onLogout={handleLogout}
      />
    </header>
  );
}
