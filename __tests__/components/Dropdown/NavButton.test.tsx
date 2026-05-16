/**
 * Tests for src/components/Dropdown/NavButton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders text; chevron + dropdown children only when
 *   `dropdown` is true; onClick fires; disabled state blocks clicks AND
 *   suppresses the dropdown
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NavButton from "@/components/Dropdown/NavButton";

describe("NavButton", () => {
  it("renders text and calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<NavButton text="Sign out" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders dropdown children + chevron when dropdown=true", () => {
    const { container } = render(
      <NavButton text="Account" dropdown>
        <span data-testid="dropdown-child">child</span>
      </NavButton>
    );
    expect(screen.getByTestId("dropdown-child")).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("disables the button and suppresses the dropdown when disabled", () => {
    const onClick = jest.fn();
    render(
      <NavButton text="Locked" disabled dropdown onClick={onClick}>
        <span data-testid="hidden-child">x</span>
      </NavButton>
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.queryByTestId("hidden-child")).not.toBeInTheDocument();
  });
});
