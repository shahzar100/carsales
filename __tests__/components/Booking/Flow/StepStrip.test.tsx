/**
 * Tests for src/components/Booking/Flow/StepStrip.tsx
 *
 * Standards coverage:
 * - 📋 Functional: step number / total / title render; dot CSS classes
 *   reflect done/now/upcoming state; Back button only shows when onBack
 *   is supplied
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StepStrip, { STEP_LABELS } from "@/components/Booking/Flow/StepStrip";

describe("StepStrip", () => {
  it("renders the step counter and title", () => {
    render(<StepStrip step={2} title="Pick a package" />);
    expect(
      screen.getByText(`Step 2 of ${STEP_LABELS.length}`)
    ).toBeInTheDocument();
    expect(screen.getByText("Pick a package")).toBeInTheDocument();
    expect(
      screen.getByText(`2/${STEP_LABELS.length}`)
    ).toBeInTheDocument();
  });

  it("classifies each step dot as done / now / upcoming", () => {
    const { container } = render(<StepStrip step={3} title="x" total={5} />);
    const dots = container.querySelectorAll(".bk-step-dot");
    expect(dots).toHaveLength(5);
    expect(dots[0].className).toContain("done");
    expect(dots[1].className).toContain("done");
    expect(dots[2].className).toContain("now");
    // Upcoming dots have no extra modifier class
    expect(dots[3].className.trim()).toBe("bk-step-dot");
    expect(dots[4].className.trim()).toBe("bk-step-dot");
  });

  it("hides the Back button when onBack is not supplied", () => {
    render(<StepStrip step={1} title="x" />);
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
  });

  it("renders a Back button and calls onBack when clicked", () => {
    const onBack = jest.fn();
    render(<StepStrip step={2} title="x" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("honours a custom total", () => {
    render(<StepStrip step={1} title="x" total={3} />);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });
});
