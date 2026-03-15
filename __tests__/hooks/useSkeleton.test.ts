/**
 * Unit tests for the useSkeleton hook
 * Tests timer-based skeleton loading state with fake timers
 */
import { renderHook, act } from "@testing-library/react";
import { useSkeleton } from "@/hooks/useSkeleton";

describe("useSkeleton", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Fix Math.random so the duration is deterministic: min + 0.5 * (max - min + 1)
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should return true initially (loading state)", () => {
    const { result } = renderHook(() => useSkeleton());
    expect(result.current).toBe(true);
  });

  it("should return false after the timer expires", () => {
    const { result } = renderHook(() => useSkeleton(1000, 3000));
    // With Math.random() = 0.5 → duration = 1000 + floor(0.5 * 2001) = 1000 + 1000 = 2000
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1999);
    });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it("should respect custom min/max durations", () => {
    const { result } = renderHook(() => useSkeleton(500, 500));
    // min === max → duration = 500 + floor(0.5 * 1) = 500
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(false);
  });

  it("should use default parameters (1000–3000ms)", () => {
    const { result } = renderHook(() => useSkeleton());
    // defaults: min=1000, max=3000 → duration = 1000 + floor(0.5 * 2001) = 2000
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(false);
  });

  it("should clean up the timer on unmount", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const { unmount } = renderHook(() => useSkeleton());

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("should not change state after unmount", () => {
    const { result, unmount } = renderHook(() => useSkeleton(100, 100));
    expect(result.current).toBe(true);

    unmount();

    // Advance past the timer — should not throw
    act(() => {
      jest.advanceTimersByTime(200);
    });
  });
});
