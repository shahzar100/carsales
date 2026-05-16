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

// `Step 2 of 5` and `2/5` are split across `<motion.span>` and plain text
// nodes (the count is animated). Match against flattened textContent so
// the assertion doesn't care about the DOM split.
const flatText = (el: HTMLElement | Document = document.body) =>
  (el.textContent ?? "").replace(/\s+/g, " ");

describe("StepStrip", () => {
  it("renders the step counter and title", () => {
    render(<StepStrip step={2} title="Pick a package" />);
    expect(flatText()).toMatch(
      new RegExp(`Step\\s+2\\s+of\\s+${STEP_LABELS.length}`)
    );
    expect(screen.getByText("Pick a package")).toBeInTheDocument();
    expect(flatText()).toMatch(new RegExp(`2\\s*/\\s*${STEP_LABELS.length}`));
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
    expect(flatText()).toMatch(/Step\s+1\s+of\s+3/);
    expect(flatText()).toMatch(/1\s*\/\s*3/);
  });
});
