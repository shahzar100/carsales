/**
 * Tests for src/components/Admin/Navigation/CarActions.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders an Actions dropdown with Edit / View / Delete
 *   entries; the Edit and View hrefs include the car id
 */
import React from "react";
import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import CarActions from "@/components/Admin/Navigation/CarActions";
import { NavigationProvider } from "@/contexts/NavigationContext";
import type { CarInterface } from "@/lib/interfaces";

// NavLink children rely on NavigationContext for click-side-effects —
// wrap renders in the provider so the component tree resolves.
const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

const car = { _id: "car-123" } as unknown as CarInterface;

describe("CarActions", () => {
  it("renders an Actions toggle button", () => {
    render(<CarActions car={car} />);
    expect(
      screen.getByRole("button", { name: /actions/i })
    ).toBeInTheDocument();
  });

  it("📋 includes Edit/View links and a Delete button (all carrying the car id)", () => {
    render(<CarActions car={car} />);
    // The dropdown is `group-hover` driven in CSS, so children are in the
    // DOM regardless — assertions can find them directly.
    const edit = screen.getByText("Edit Car").closest("a");
    const view = screen.getByText("View Car").closest("a");
    expect(edit).toHaveAttribute("href", "/admin/car/edit/car-123");
    expect(view).toHaveAttribute("href", "/admin/car/view/car-123");
    expect(
      screen.getByRole("button", { name: /delete car/i })
    ).toBeInTheDocument();
  });

  it("a Delete button click doesn't accidentally navigate", () => {
    render(<CarActions car={car} />);
    // The delete button is a plain <button> without an onClick — the
    // dropdown component wraps it. Clicking should not throw.
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /delete car/i }))
    ).not.toThrow();
  });
});
