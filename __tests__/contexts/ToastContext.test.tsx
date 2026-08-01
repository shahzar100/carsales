/**
 * Tests for ToastContext (src/contexts/ToastContext.tsx)
 * 
 * Standards coverage:
 * - 📋 Functional: Toast creation, removal, auto-dismissal
 * - 🎯 Usability: Different toast types, clear API
 * - 🔒 Security: Error handling, preventing context misuse
 */
import React from "react";
import { render, screen, act, renderHook } from "@testing-library/react";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import { DEFAULT_TOAST_DURATION } from "@/contexts/types";

// Mock timers for testing auto-dismissal
jest.useFakeTimers();

describe("ToastContext", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  describe("📋 Functional Standards - Provider Setup", () => {
    it("should render children", () => {
      render(
        <ToastProvider>
          <div>Test Child</div>
        </ToastProvider>
      );

      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("should provide toast context to children", () => {
      const TestComponent = () => {
        const toast = useToast();
        return <div>{toast ? "Context Available" : "No Context"}</div>;
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText("Context Available")).toBeInTheDocument();
    });

    it("should throw error when useToast is used outside provider", () => {
      const TestComponent = () => {
        useToast();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => render(<TestComponent />)).toThrow(
        "useToast must be used within a ToastProvider"
      );

      console.error = originalError;
    });
  });

  describe("📋 Functional Standards - Toast Creation", () => {
    it("should add a toast with addToast", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      let toastId: string;
      act(() => {
        toastId = result.current.addToast({
          type: "success",
          title: "Test Toast",
          message: "Test message",
        });
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0].title).toBe("Test Toast");
      expect(result.current.toasts[0].message).toBe("Test message");
      expect(result.current.toasts[0].type).toBe("success");
      expect(result.current.toasts[0].id).toBe(toastId!);
    });

    it("should generate unique IDs for each toast", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const ids: string[] = [];
      act(() => {
        ids.push(result.current.addToast({ type: "info", title: "Toast 1" }));
        ids.push(result.current.addToast({ type: "info", title: "Toast 2" }));
        ids.push(result.current.addToast({ type: "info", title: "Toast 3" }));
      });

      expect(new Set(ids).size).toBe(3);
      expect(result.current.toasts.length).toBe(3);
    });

    it("should use default duration when not specified", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "Default Duration",
        });
      });

      expect(result.current.toasts[0].duration).toBe(DEFAULT_TOAST_DURATION);
    });

    it("should use custom duration when specified", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "Custom Duration",
          duration: 10000,
        });
      });

      expect(result.current.toasts[0].duration).toBe(10000);
    });

    it("should support optional message field", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "Title Only",
        });
      });

      expect(result.current.toasts[0].message).toBeUndefined();
    });

    it("should support action field", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const mockAction = jest.fn();
      act(() => {
        result.current.addToast({
          type: "info",
          title: "With Action",
          action: {
            label: "Undo",
            onClick: mockAction,
          },
        });
      });

      expect(result.current.toasts[0].action).toBeDefined();
      expect(result.current.toasts[0].action?.label).toBe("Undo");
    });
  });

  describe("📋 Functional Standards - Convenience Methods", () => {
    it("should create success toast with success()", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.success("Success!", "Operation completed");
      });

      expect(result.current.toasts[0].type).toBe("success");
      expect(result.current.toasts[0].title).toBe("Success!");
      expect(result.current.toasts[0].message).toBe("Operation completed");
    });

    it("should create error toast with error()", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.error("Error!", "Something went wrong");
      });

      expect(result.current.toasts[0].type).toBe("error");
      expect(result.current.toasts[0].title).toBe("Error!");
      expect(result.current.toasts[0].duration).toBe(7000); // Errors stay longer
    });

    it("should create warning toast with warning()", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.warning("Warning!", "Please check this");
      });

      expect(result.current.toasts[0].type).toBe("warning");
      expect(result.current.toasts[0].duration).toBe(6000); // Warnings stay a bit longer
    });

    it("should create info toast with info()", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.info("Info", "Here's some information");
      });

      expect(result.current.toasts[0].type).toBe("info");
      expect(result.current.toasts[0].title).toBe("Info");
    });

    it("should allow overriding default duration in convenience methods", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.error("Error", "Message", { duration: 3000 });
      });

      expect(result.current.toasts[0].duration).toBe(3000);
    });
  });

  describe("📋 Functional Standards - Toast Removal", () => {
    it("should remove toast by ID", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      let toastId: string;
      act(() => {
        toastId = result.current.success("Test");
      });

      expect(result.current.toasts.length).toBe(1);

      act(() => {
        result.current.removeToast(toastId!);
      });

      expect(result.current.toasts.length).toBe(0);
    });

    it("should remove only the specified toast", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      let id1: string, id2: string, id3: string;
      act(() => {
        id1 = result.current.success("Toast 1");
        id2 = result.current.success("Toast 2");
        id3 = result.current.success("Toast 3");
      });

      expect(result.current.toasts.length).toBe(3);

      act(() => {
        result.current.removeToast(id2!);
      });

      expect(result.current.toasts.length).toBe(2);
      expect(result.current.toasts.find(t => t.id === id1)).toBeDefined();
      expect(result.current.toasts.find(t => t.id === id3)).toBeDefined();
      expect(result.current.toasts.find(t => t.id === id2)).toBeUndefined();
    });

    it("should handle removing non-existent toast gracefully", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.success("Test");
      });

      expect(result.current.toasts.length).toBe(1);

      act(() => {
        result.current.removeToast("non-existent-id");
      });

      expect(result.current.toasts.length).toBe(1);
    });

    it("should clear all toasts with clearAllToasts", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.success("Toast 1");
        result.current.error("Toast 2");
        result.current.warning("Toast 3");
      });

      expect(result.current.toasts.length).toBe(3);

      act(() => {
        result.current.clearAllToasts();
      });

      expect(result.current.toasts.length).toBe(0);
    });
  });

  describe("📋 Functional Standards - Auto-dismissal", () => {
    it("should store duration on toast (component-owned dismissal)", () => {
      // Auto-dismissal is owned by the Toast component's animation-frame
      // countdown, not by a setTimeout in the context. Verify the duration
      // is stored correctly and that removeToast() removes the toast on demand.
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "Auto Remove",
          duration: 3000,
        });
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0].duration).toBe(3000);

      act(() => {
        result.current.removeToast(result.current.toasts[0].id);
      });

      expect(result.current.toasts.length).toBe(0);
    });

    it("should not auto-remove persistent toasts", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "Persistent",
          duration: 3000,
          persistent: true,
        });
      });

      expect(result.current.toasts.length).toBe(1);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.toasts.length).toBe(1);
    });

    it("should not auto-remove toasts with duration 0", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "No Auto Remove",
          duration: 0,
        });
      });

      expect(result.current.toasts.length).toBe(1);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.toasts.length).toBe(1);
    });

    it("should handle multiple toasts with different durations (durations stored)", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({ type: "info", title: "Short", duration: 1000 });
        result.current.addToast({ type: "info", title: "Medium", duration: 3000 });
        result.current.addToast({ type: "info", title: "Long", duration: 5000 });
      });

      expect(result.current.toasts.length).toBe(3);
      const durations = result.current.toasts.map((t) => t.duration);
      expect(durations).toContain(1000);
      expect(durations).toContain(3000);
      expect(durations).toContain(5000);
    });
  });

  describe("🎯 Usability Standards", () => {
    it("should maintain toast order (FIFO)", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.success("First");
        result.current.success("Second");
        result.current.success("Third");
      });

      expect(result.current.toasts[0].title).toBe("First");
      expect(result.current.toasts[1].title).toBe("Second");
      expect(result.current.toasts[2].title).toBe("Third");
    });

    it("should provide clear type differentiation", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.success("Success");
        result.current.error("Error");
        result.current.warning("Warning");
        result.current.info("Info");
      });

      const types = result.current.toasts.map(t => t.type);
      expect(types).toEqual(["success", "error", "warning", "info"]);
    });
  });

  describe("🔒 Security Standards", () => {
    it("should handle XSS attempts in toast title", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const xssTitle = "<script>alert('xss')</script>";
      act(() => {
        result.current.success(xssTitle);
      });

      // Should store the string but not execute it
      expect(result.current.toasts[0].title).toBe(xssTitle);
      expect(() => result.current.toasts[0].title).not.toThrow();
    });

    it("should handle XSS attempts in toast message", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const xssMessage = "<img onerror='alert(1)' />";
      act(() => {
        result.current.info("Title", xssMessage);
      });

      expect(result.current.toasts[0].message).toBe(xssMessage);
    });

    it("should handle malicious action callbacks safely", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const maliciousCallback = jest.fn(() => {
        throw new Error("Malicious action");
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "With Action",
          action: {
            label: "Click",
            onClick: maliciousCallback,
          },
        });
      });

      // Action should be stored but not executed during creation
      expect(result.current.toasts[0].action).toBeDefined();
      expect(maliciousCallback).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("should handle empty title", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.success("");
      });

      expect(result.current.toasts[0].title).toBe("");
    });

    it("should handle very long titles", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const longTitle = "a".repeat(1000);
      act(() => {
        result.current.success(longTitle);
      });

      expect(result.current.toasts[0].title).toBe(longTitle);
    });

    it("should handle unicode characters", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.success("成功", "操作已完成 🎉");
      });

      expect(result.current.toasts[0].title).toBe("成功");
      expect(result.current.toasts[0].message).toBe("操作已完成 🎉");
    });

    it("should handle negative duration gracefully", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "Negative Duration",
          duration: -1000,
        });
      });

      expect(result.current.toasts.length).toBe(1);
      // Should not auto-remove with negative duration
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.toasts.length).toBe(1);
    });

    it("should handle extremely large duration", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.addToast({
          type: "info",
          title: "Large Duration",
          duration: Number.MAX_SAFE_INTEGER,
        });
      });

      expect(result.current.toasts[0].duration).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle rapid toast creation", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.success(`Toast ${i}`);
        }
      });

      expect(result.current.toasts.length).toBe(100);
    });
  });

  describe("Performance", () => {
    it("should handle large number of toasts efficiently", () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const start = Date.now();
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.addToast({
            type: "info",
            title: `Toast ${i}`,
            persistent: true,
          });
        }
      });
      const duration = Date.now() - start;

      expect(result.current.toasts.length).toBe(1000);
      expect(duration).toBeLessThan(1000);
    });
  });
});
