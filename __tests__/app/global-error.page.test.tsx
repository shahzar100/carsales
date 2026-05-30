/**
 * Tests for src/app/global-error.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders title + reset button; clicking the button
 *   invokes the `reset()` prop.
 * - 🔍 Observability: `logError` is called exactly once on mount with
 *   `{ boundary: "global-error" }` context, even when the component
 *   re-renders.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockLogError = jest.fn();

jest.mock("@/lib/utils/observability", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import GlobalError from "@/app/global-error";

describe("global-error page", () => {
  const baseError = Object.assign(new Error("boom"), { digest: "abc123" });

  beforeEach(() => {
    mockLogError.mockClear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders title and friendly copy", () => {
    const reset = jest.fn();
    render(<GlobalError error={baseError} reset={reset} />);
    expect(
      screen.getByRole("heading", { name: /something went wrong/i, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we've been notified/i)
    ).toBeInTheDocument();
  });

  it("renders Try again button that calls reset()", () => {
    const reset = jest.fn();
    render(<GlobalError error={baseError} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("calls logError once on mount with boundary context", () => {
    const reset = jest.fn();
    const { rerender } = render(
      <GlobalError error={baseError} reset={reset} />
    );
    rerender(<GlobalError error={baseError} reset={reset} />);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError).toHaveBeenCalledWith(
      baseError,
      expect.objectContaining({ boundary: "global-error", digest: "abc123" })
    );
  });
});
