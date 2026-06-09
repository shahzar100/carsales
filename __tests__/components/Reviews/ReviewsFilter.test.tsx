/**
 * Standards coverage:
 * - Functional: renders a tab for every SERVICE_TYPE; clicking a tab calls
 *   onFilterChange with the correct value and updates the internal active state;
 *   default active filter is "all"; switching tabs deselects the previous one.
 * - Security: callback only ever receives one of the known service-type values
 *   (no arbitrary/injected strings reach onFilterChange).
 * - Usability: exposes an accessible tablist with a descriptive aria-label and
 *   per-tab aria-selected state so assistive tech can announce the active filter.
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ReviewsFilter from "@/components/Reviews/ReviewsFilter";

const SERVICE_TYPES = [
  { value: "all", label: "All" },
  { value: "car-purchase", label: "Car Purchase" },
  { value: "service", label: "Service" },
  { value: "viewing", label: "Viewing" },
  { value: "detailing", label: "Detailing" },
  { value: "tinting", label: "Tinting" },
  { value: "recovery", label: "Recovery" },
];

describe("ReviewsFilter", () => {
  it("renders an accessible tablist with a descriptive label", () => {
    render(<ReviewsFilter onFilterChange={jest.fn()} />);

    const tablist = screen.getByRole("tablist", {
      name: "Filter reviews by service type",
    });
    expect(tablist).toBeInTheDocument();
  });

  it("renders a tab for every service type with the correct label", () => {
    render(<ReviewsFilter onFilterChange={jest.fn()} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(SERVICE_TYPES.length);

    SERVICE_TYPES.forEach((type) => {
      expect(
        screen.getByRole("tab", { name: type.label })
      ).toBeInTheDocument();
    });
  });

  it("renders every tab as a non-submitting button", () => {
    render(<ReviewsFilter onFilterChange={jest.fn()} />);

    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab).toHaveAttribute("type", "button");
    });
  });

  it("defaults the active tab to 'All'", () => {
    render(<ReviewsFilter onFilterChange={jest.fn()} />);

    const allTab = screen.getByRole("tab", { name: "All" });
    expect(allTab).toHaveAttribute("aria-selected", "true");

    // Every other tab should be unselected on first render.
    SERVICE_TYPES.filter((t) => t.value !== "all").forEach((type) => {
      expect(screen.getByRole("tab", { name: type.label })).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });
  });

  it("does not invoke onFilterChange on initial render", () => {
    const onFilterChange = jest.fn();
    render(<ReviewsFilter onFilterChange={onFilterChange} />);

    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it("calls onFilterChange with the selected value when a tab is clicked", () => {
    const onFilterChange = jest.fn();
    render(<ReviewsFilter onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByRole("tab", { name: "Car Purchase" }));

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith("car-purchase");
  });

  it("updates the active (aria-selected) state when a tab is clicked", () => {
    render(<ReviewsFilter onFilterChange={jest.fn()} />);

    const detailingTab = screen.getByRole("tab", { name: "Detailing" });
    const allTab = screen.getByRole("tab", { name: "All" });

    fireEvent.click(detailingTab);

    expect(detailingTab).toHaveAttribute("aria-selected", "true");
    // Previous default ("all") is deselected once another tab is active.
    expect(allTab).toHaveAttribute("aria-selected", "false");
  });

  it("calls onFilterChange with the correct value for each service type", () => {
    const onFilterChange = jest.fn();
    render(<ReviewsFilter onFilterChange={onFilterChange} />);

    SERVICE_TYPES.forEach((type, index) => {
      fireEvent.click(screen.getByRole("tab", { name: type.label }));
      expect(onFilterChange).toHaveBeenCalledTimes(index + 1);
      expect(onFilterChange).toHaveBeenLastCalledWith(type.value);
    });
  });

  it("keeps exactly one tab selected after switching between tabs", () => {
    render(<ReviewsFilter onFilterChange={jest.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Viewing" }));
    fireEvent.click(screen.getByRole("tab", { name: "Recovery" }));

    const selected = screen
      .getAllByRole("tab")
      .filter((tab) => tab.getAttribute("aria-selected") === "true");

    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName("Recovery");
  });

  it("re-fires onFilterChange when the same tab is clicked again", () => {
    const onFilterChange = jest.fn();
    render(<ReviewsFilter onFilterChange={jest.fn()} />);

    // Re-render with a tracked callback to assert repeated clicks still fire.
    render(<ReviewsFilter onFilterChange={onFilterChange} />);

    const tablist = screen.getAllByRole("tablist")[1];
    const tintingTab = within(tablist).getByRole("tab", { name: "Tinting" });

    fireEvent.click(tintingTab);
    fireEvent.click(tintingTab);

    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(onFilterChange).toHaveBeenNthCalledWith(1, "tinting");
    expect(onFilterChange).toHaveBeenNthCalledWith(2, "tinting");
  });
});
