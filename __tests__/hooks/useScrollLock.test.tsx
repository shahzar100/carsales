/**
 * Tests for the reference-counted scroll lock hook.
 *
 * Standards coverage:
 * - 📋 Functional: Lock applied while active, released on unmount
 * - 🧮 Reference counting: Two consumers — closing one keeps the lock
 *   until both close (this is the regression Day 4 was tracking)
 * - 🛡️ Resilience: Pre-existing inline styles are restored
 */
import { renderHook } from "@testing-library/react";
import {
  useScrollLock,
  __resetScrollLockForTests,
} from "@/hooks/useScrollLock";

describe("useScrollLock", () => {
  beforeEach(() => {
    __resetScrollLockForTests();
  });

  it("locks body scroll while active", () => {
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("does not lock when active is false", () => {
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe("");
  });

  it("two simultaneous consumers — closing one keeps the lock", () => {
    // Reproduce the Modal/NavMenu race from the audit.
    const modal = renderHook(() => useScrollLock(true));
    const nav = renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe("hidden");

    nav.unmount(); // NavMenu closes — Modal still wants the lock.
    expect(document.body.style.overflow).toBe("hidden");

    modal.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores pre-existing inline styles when the last lock is released", () => {
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "10px";

    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.paddingRight).toBe("10px");
  });

  it("flipping active toggles the lock", () => {
    const { rerender } = renderHook(({ active }) => useScrollLock(active), {
      initialProps: { active: false },
    });
    expect(document.body.style.overflow).toBe("");

    rerender({ active: true });
    expect(document.body.style.overflow).toBe("hidden");

    rerender({ active: false });
    expect(document.body.style.overflow).toBe("");
  });
});
