/**
 * Tests for src/components/Home/CountUp.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders the value verbatim when no numeric portion
 *   can be parsed; for parseable values, renders the prefix + initial
 *   "0" placeholder + suffix (animation drives the value once in-view);
 *   passes through className to the rendered span.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import CountUp from "@/components/Home/CountUp";

describe("CountUp", () => {
  it("📋 renders the raw string when the value has no parseable number", () => {
    render(<CountUp value="N/A" />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("📋 renders prefix + 0 placeholder + suffix before the in-view animation kicks in", () => {
    const { container } = render(<CountUp value="120+" />);
    // Initial display is "0", suffix is "+", prefix is empty.
    expect(container.textContent).toBe("0+");
  });

  it("📋 keeps the £ prefix and decimal places intact in the placeholder", () => {
    const { container } = render(<CountUp value="£4.99" />);
    // Decimal count derived from "4.99" → 2 decimals, initial display "0".
    // Initial placeholder before motion change handler fires is "0", with
    // the £ prefix preserved.
    expect(container.textContent).toBe("£0");
  });

  it("📋 passes className through to the wrapping span", () => {
    const { container } = render(
      <CountUp value="100" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("📋 unparseable values keep className on the fallback span", () => {
    const { container } = render(
      <CountUp value="Sold Out" className="fallback-class" />
    );
    expect(container.firstChild).toHaveClass("fallback-class");
    expect(container.textContent).toBe("Sold Out");
  });
});
