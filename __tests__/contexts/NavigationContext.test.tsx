/**
 * Tests for src/contexts/NavigationContext.tsx
 *
 * Standards coverage:
 * - 📋 Functional: state mutations propagate, default values are correct
 * - 🎯 Usability: useNavigation outside provider throws an explicit error
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  NavigationProvider,
  useNavigation,
} from "@/contexts/NavigationContext";

function Probe() {
  const nav = useNavigation();
  return (
    <div>
      <span data-testid="loading">{String(nav.isNavigating)}</span>
      <span data-testid="target">{nav.navigationTarget ?? "(none)"}</span>
      <button onClick={() => nav.setIsNavigating(true)}>start</button>
      <button onClick={() => nav.setIsNavigating(false)}>stop</button>
      <button onClick={() => nav.setNavigationTarget("/admin/cars")}>
        set-target
      </button>
      <button onClick={() => nav.setNavigationTarget(null)}>clear-target</button>
    </div>
  );
}

describe("NavigationContext", () => {
  it("defaults to isNavigating=false and navigationTarget=null", () => {
    render(
      <NavigationProvider>
        <Probe />
      </NavigationProvider>
    );
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("target")).toHaveTextContent("(none)");
  });

  it("propagates setIsNavigating and setNavigationTarget updates", () => {
    render(
      <NavigationProvider>
        <Probe />
      </NavigationProvider>
    );
    act(() => {
      screen.getByText("start").click();
      screen.getByText("set-target").click();
    });
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    expect(screen.getByTestId("target")).toHaveTextContent("/admin/cars");
    act(() => {
      screen.getByText("stop").click();
      screen.getByText("clear-target").click();
    });
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("target")).toHaveTextContent("(none)");
  });

  it("throws when useNavigation is called outside the provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/NavigationProvider/);
    consoleError.mockRestore();
  });
});
