"use client";

/**
 * Reference-counted body scroll lock.
 *
 * Multiple components in the app want to freeze body scroll while they're
 * open (Modal, NavMenu, ConfirmDialog, full-screen overlays). Before this
 * hook each component naively flipped `document.body.style.overflow` and
 * reset it to `""` on close — so closing one would unlock scroll even
 * while another was still open. (Repro: open the share Modal from a car
 * detail page, then open the mobile NavMenu while the modal is up; closing
 * NavMenu unlocked the body even though the modal was still visible.)
 *
 * `useScrollLock(active)` keeps a module-level counter of how many
 * components are currently asking for the lock. The body is only unlocked
 * when the count drops back to zero. Style is captured before the first
 * lock and restored on the last unlock so we don't trample inline styles
 * that were already there.
 *
 * Usage:
 *
 * ```tsx
 * useScrollLock(isOpen);
 * ```
 */

import { useEffect } from "react";

let lockCount = 0;
let savedOverflow: string | null = null;
let savedPaddingRight: string | null = null;

function applyLock() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    // Compensate for the disappearing scrollbar so layout doesn't shift.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function releaseLock() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return; // Defensive: never go negative.
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow ?? "";
    document.body.style.paddingRight = savedPaddingRight ?? "";
    savedOverflow = null;
    savedPaddingRight = null;
  }
}

/**
 * Lock body scroll while `active` is true. Safe to call on the server —
 * the lock is only applied/released after the component mounts.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    applyLock();
    return () => {
      releaseLock();
    };
  }, [active]);
}

export default useScrollLock;

/**
 * Test-only helper to reset the module-level counter between tests.
 * Not part of the public API — exported via a separate name so production
 * code reading `useScrollLock` doesn't accidentally call it.
 */
export function __resetScrollLockForTests(): void {
  lockCount = 0;
  savedOverflow = null;
  savedPaddingRight = null;
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }
}
