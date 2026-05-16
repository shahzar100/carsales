/**
 * Tests for src/hooks/useToast.ts
 *
 * This module is a re-export shim from `@/contexts/ToastContext`. We
 * still cover it so the public hook contract is asserted at the shim
 * boundary — if a future refactor accidentally drops the re-export the
 * compile is fine but consumers break at runtime.
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider } from "@/contexts/ToastContext";
import { useToast } from "@/hooks/useToast";

function Probe() {
  const toast = useToast();
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    toast.success("Saved", "Your changes are live");
  });
  return (
    <div>
      <span data-testid="count">{toast.toasts.length}</span>
      <span data-testid="title">{toast.toasts[0]?.title ?? ""}</span>
    </div>
  );
}

describe("useToast (re-export from @/contexts/ToastContext)", () => {
  it("exposes the same hook as the context module", async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <Probe />
        </ToastProvider>
      );
    });
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("title")).toHaveTextContent("Saved");
  });

  it("throws the documented error when used outside a provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    function Bare() {
      useToast();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/ToastProvider/);
    consoleError.mockRestore();
  });
});
