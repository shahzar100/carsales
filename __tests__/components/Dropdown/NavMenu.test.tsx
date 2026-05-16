/**
 * Tests for src/components/Dropdown/NavMenu.tsx
 *
 * Standards coverage:
 * - 📋 Functional: toggle button opens/closes the full-screen panel;
 *   children only render inside the open panel; title appears in the open
 *   panel header; close button (X) reverts state
 * - 🎯 Usability: a11y attributes — aria-expanded on the toggle, aria-label
 *   on both the toggle and the close button
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NavMenu from "@/components/Dropdown/NavMenu";

describe("NavMenu", () => {
  it("starts closed: children are not in the DOM", () => {
    render(
      <NavMenu title="Menu">
        <a data-testid="link-1">Home</a>
      </NavMenu>
    );
    expect(screen.queryByTestId("link-1")).not.toBeInTheDocument();
  });

  it("📋 opens when the toggle is clicked", () => {
    render(
      <NavMenu title="Main menu">
        <a data-testid="link-1">Home</a>
      </NavMenu>
    );
    fireEvent.click(
      screen.getByRole("button", { name: /toggle menu/i })
    );
    expect(screen.getByTestId("link-1")).toBeInTheDocument();
    // Title shows in the panel header.
    expect(screen.getAllByText("Main menu").length).toBeGreaterThan(0);
  });

  it("📋 closes again when the close button is clicked", () => {
    render(
      <NavMenu title="x">
        <a data-testid="link-1">Home</a>
      </NavMenu>
    );
    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    fireEvent.click(toggle);
    expect(screen.getByTestId("link-1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
    expect(screen.queryByTestId("link-1")).not.toBeInTheDocument();
  });

  it("🎯 reflects open state on the toggle's aria-expanded", () => {
    render(
      <NavMenu title="x">
        <a />
      </NavMenu>
    );
    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
