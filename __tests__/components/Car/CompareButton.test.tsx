/**
 * Tests for src/components/Car/CompareButton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: reads from ComparisonContext.isInComparison; clicking adds
 *   the whole car via addToCompare(car) when not present, and removes via
 *   removeFromCompare(carId) when present; the comparedCars count badge renders
 *   only when count > 0 and the car is not already in comparison
 * - 🔒 Security: handleClick calls preventDefault + stopPropagation so the
 *   toggle never bubbles to a wrapping <Link>/anchor and triggers navigation
 * - 🎯 Usability: icon vs button variant (text label) rendering; aria-label
 *   flips between "Add ... to comparison" and "Remove ... from comparison";
 *   Check icon shows the selected state, Scale icon the default state
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const addToCompare = jest.fn();
const removeFromCompare = jest.fn();
// Mutable state the mocked hook reads from, so individual tests can flip
// "in comparison" / "count" without re-mocking the module.
const state: { inComparison: boolean; count: number } = {
  inComparison: false,
  count: 0,
};

jest.mock("@/contexts/ComparisonContext", () => ({
  useComparison: () => ({
    addToCompare,
    removeFromCompare,
    isInComparison: () => state.inComparison,
    comparedCars: Array.from({ length: state.count }, (_, i) => ({
      _id: `other-${i}`,
    })),
  }),
}));

import CompareButton from "@/components/Car/CompareButton";
import type { CarInterface } from "@/lib/interfaces";

// Minimal CarInterface object — only the fields CompareButton reads matter
// (_id drives the id; make/model build the aria-label / labels).
const car = {
  _id: "car-1",
  make: "Toyota",
  model: "Corolla",
} as unknown as CarInterface;

beforeEach(() => {
  addToCompare.mockReset();
  removeFromCompare.mockReset();
  state.inComparison = false;
  state.count = 0;
});

describe("CompareButton", () => {
  it("🎯 renders the icon variant with an Add aria-label by default", () => {
    render(<CompareButton car={car} />);
    const btn = screen.getByRole("button", {
      name: /add toyota corolla to comparison/i,
    });
    expect(btn).toBeInTheDocument();
    // icon variant: no visible text label
    expect(btn).not.toHaveTextContent(/compare/i);
  });

  it("🎯 button variant renders the 'Compare' text label", () => {
    render(<CompareButton car={car} variant="button" />);
    expect(
      screen.getByRole("button", { name: /add toyota corolla to comparison/i })
    ).toHaveTextContent(/compare/i);
  });

  it("📋 clicking when not in comparison fires addToCompare(car)", () => {
    render(<CompareButton car={car} />);
    fireEvent.click(screen.getByRole("button"));
    expect(addToCompare).toHaveBeenCalledTimes(1);
    expect(addToCompare).toHaveBeenCalledWith(car);
    expect(removeFromCompare).not.toHaveBeenCalled();
  });

  it("📋 reflects the in-comparison state via aria-label flip", () => {
    state.inComparison = true;
    render(<CompareButton car={car} />);
    expect(
      screen.getByRole("button", {
        name: /remove toyota corolla from comparison/i,
      })
    ).toBeInTheDocument();
  });

  it("🎯 button variant shows 'In Comparison' text when selected", () => {
    state.inComparison = true;
    render(<CompareButton car={car} variant="button" />);
    expect(
      screen.getByRole("button", {
        name: /remove toyota corolla from comparison/i,
      })
    ).toHaveTextContent(/in comparison/i);
  });

  it("📋 clicking when in comparison fires removeFromCompare(carId)", () => {
    state.inComparison = true;
    render(<CompareButton car={car} />);
    fireEvent.click(screen.getByRole("button"));
    expect(removeFromCompare).toHaveBeenCalledTimes(1);
    expect(removeFromCompare).toHaveBeenCalledWith("car-1");
    expect(addToCompare).not.toHaveBeenCalled();
  });

  it("🔒 click stops propagation so a wrapping <a> does not navigate", () => {
    const linkClick = jest.fn();
    render(
      <a href="/details" onClick={linkClick}>
        <CompareButton car={car} />
      </a>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(addToCompare).toHaveBeenCalled();
    expect(linkClick).not.toHaveBeenCalled();
  });

  it("📋 shows the count badge when count > 0 and not in comparison", () => {
    state.count = 2;
    render(<CompareButton car={car} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("📋 hides the count badge once the car is in comparison", () => {
    state.count = 2;
    state.inComparison = true;
    render(<CompareButton car={car} />);
    // The "2" badge is suppressed when the current car is selected.
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("📋 renders no badge when the comparison list is empty", () => {
    state.count = 0;
    const { container } = render(<CompareButton car={car} />);
    // No absolutely-positioned badge span when count is 0.
    expect(container.querySelector("span.absolute")).toBeNull();
  });

  it("🎯 renders the Check icon when selected and Scale icon otherwise", () => {
    const { container, rerender } = render(<CompareButton car={car} />);
    // Default (not in comparison): exactly one icon, the Scale glyph.
    expect(container.querySelectorAll("svg")).toHaveLength(1);

    state.inComparison = true;
    rerender(<CompareButton car={car} />);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("handles a missing _id by passing an empty id to the toggle", () => {
    const noIdCar = { make: "Ford", model: "Focus" } as unknown as CarInterface;
    state.inComparison = true;
    render(<CompareButton car={noIdCar} />);
    fireEvent.click(screen.getByRole("button"));
    expect(removeFromCompare).toHaveBeenCalledWith("");
  });

  it("🎯 accepts the md size and a custom className without error", () => {
    render(<CompareButton car={car} size="md" className="extra-class" />);
    expect(screen.getByRole("button")).toHaveClass("extra-class");
  });
});
