/**
 * Tests for src/components/Car/SaveCarButton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: heart toggle reads from SavedCarsContext.isSaved and
 *   fires `toggle(carId)` on click; `aria-pressed` mirrors the saved state
 * - 🎯 Usability: stops the click from bubbling to a parent <Link>; default
 *   sr-only labels flip between "Save this car" and "Remove from saved
 *   cars"; custom label overrides both
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const toggle = jest.fn();
let saved = false;
jest.mock("@/contexts/SavedCarsContext", () => ({
  useSavedCars: () => ({
    savedIds: saved ? ["car-1"] : [],
    isSaved: (id: string) => saved && id === "car-1",
    toggle,
    remove: jest.fn(),
    clear: jest.fn(),
  }),
}));

import SaveCarButton from "@/components/Car/SaveCarButton";

beforeEach(() => {
  toggle.mockReset();
  saved = false;
});

describe("SaveCarButton", () => {
  it("renders an aria-pressed=false button by default", () => {
    render(<SaveCarButton carId="car-1" />);
    expect(
      screen.getByRole("button", { name: /save this car/i })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("📋 reflects saved state via aria-pressed + label flip", () => {
    saved = true;
    render(<SaveCarButton carId="car-1" />);
    expect(
      screen.getByRole("button", { name: /remove from saved cars/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("📋 click fires toggle(carId)", () => {
    render(<SaveCarButton carId="car-1" />);
    fireEvent.click(screen.getByRole("button"));
    expect(toggle).toHaveBeenCalledWith("car-1");
  });

  it("🎯 click stops propagation so a wrapping <Link> doesn't navigate", () => {
    const linkClick = jest.fn();
    render(
      <a href="/details" onClick={linkClick}>
        <SaveCarButton carId="car-1" />
      </a>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(toggle).toHaveBeenCalled();
    // The wrapping link must NOT have received the click event.
    expect(linkClick).not.toHaveBeenCalled();
  });

  it("uses the custom `label` prop when supplied", () => {
    render(<SaveCarButton carId="car-1" label="Bookmark car" />);
    expect(
      screen.getByRole("button", { name: /bookmark car/i })
    ).toBeInTheDocument();
  });

  it("📋 the heart icon is filled red when saved, otherwise unfilled", () => {
    const { rerender, container } = render(<SaveCarButton carId="car-1" />);
    let icon = container.querySelector("svg") as SVGElement;
    expect(icon.getAttribute("class")).not.toContain("fill-red-600");

    saved = true;
    rerender(<SaveCarButton carId="car-1" />);
    icon = container.querySelector("svg") as SVGElement;
    expect(icon.getAttribute("class")).toContain("fill-red-600");
  });
});
