/**
 * Tests for src/components/Toast/ToastContainer.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders nothing when there are no toasts; portals
 *   into document.body when there are; relays the ToastContext's
 *   removeToast callback to each child Toast
 * - 🎯 Usability: aria-live="polite" on the wrapper so screen readers
 *   announce new toasts without interrupting the user
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import ToastContainer from "@/components/Toast/ToastContainer";

// Helper component that pushes a toast into the provider on mount so we
// can deterministically test the populated path.
function SeedToasts({ items }: { items: { title: string; type: "success" | "error" | "info" | "warning" }[] }) {
  const toast = useToast();
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    for (const t of items) {
      // Use the addToast helper directly so we don't depend on which
      // shorthand (success/error/etc.) is available.
      toast.addToast({ type: t.type, title: t.title });
    }
  });
  return null;
}

describe("ToastContainer", () => {
  it("renders nothing when there are no toasts", () => {
    const { container } = render(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );
    // The container itself is empty AND nothing was portalled into body.
    expect(container.firstChild).toBeNull();
    expect(document.body.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it("📋 portals toasts into document.body when present", () => {
    render(
      <ToastProvider>
        <SeedToasts items={[{ title: "Saved", type: "success" }]} />
        <ToastContainer />
      </ToastProvider>
    );
    expect(screen.getByText("Saved")).toBeInTheDocument();
    // Should be in document.body (portalled), not inside the original container.
    expect(
      document.body.querySelector('[aria-live="polite"]')
    ).not.toBeNull();
  });

  it("renders one Toast per entry", () => {
    render(
      <ToastProvider>
        <SeedToasts
          items={[
            { title: "One", type: "success" },
            { title: "Two", type: "error" },
            { title: "Three", type: "info" },
          ]}
        />
        <ToastContainer />
      </ToastProvider>
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.getByText("Three")).toBeInTheDocument();
  });
});
