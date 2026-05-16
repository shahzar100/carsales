/**
 * Tests for src/components/CarParts/CustomDropdown.tsx
 *
 * Standards coverage:
 * - 📋 Functional: trigger renders the placeholder when value is empty,
 *   the selected option's label otherwise; click opens the menu;
 *   selecting an option calls onChange with the right value and closes
 *   the menu; outside-click closes the menu
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CustomDropdown from "@/components/CarParts/CustomDropdown";

const options = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "refurb", label: "Refurbished" },
];

describe("CustomDropdown", () => {
  it("📋 renders the placeholder when value is empty", () => {
    render(
      <CustomDropdown
        options={options}
        placeholder="Condition"
        value=""
        onChange={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /condition/i })
    ).toBeInTheDocument();
  });

  it("📋 renders the selected option label when value matches", () => {
    render(
      <CustomDropdown
        options={options}
        placeholder="Condition"
        value="used"
        onChange={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /used/i })
    ).toBeInTheDocument();
  });

  it("📋 click opens the menu and shows all options", () => {
    render(
      <CustomDropdown
        options={options}
        placeholder="Condition"
        value=""
        onChange={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /condition/i }));
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Used")).toBeInTheDocument();
    expect(screen.getByText("Refurbished")).toBeInTheDocument();
  });

  it("📋 selecting an option fires onChange + closes the menu", () => {
    const onChange = jest.fn();
    render(
      <CustomDropdown
        options={options}
        placeholder="Condition"
        value=""
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /condition/i }));
    fireEvent.click(screen.getByText("Used"));
    expect(onChange).toHaveBeenCalledWith("used");
    // Menu should have collapsed.
    expect(screen.queryByText("Refurbished")).not.toBeInTheDocument();
  });

  it("🎯 clicking outside the dropdown closes the menu", () => {
    render(
      <div>
        <CustomDropdown
          options={options}
          placeholder="Condition"
          value=""
          onChange={jest.fn()}
        />
        <button data-testid="outside">Outside</button>
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /condition/i }));
    expect(screen.getByText("New")).toBeInTheDocument();
    // Simulate a mousedown on something outside the dropdown.
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });
});
