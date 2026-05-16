/**
 * Tests for src/components/Booking/Flow/ContinueBar.tsx
 *
 * Standards coverage:
 * - 📋 Functional: label/value/buttonLabel render; click fires onContinue;
 *   disabled state blocks clicks
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Wrench } from "lucide-react";
import ContinueBar from "@/components/Booking/Flow/ContinueBar";

describe("ContinueBar", () => {
  it("renders the label, summary value, and button label", () => {
    render(
      <ContinueBar
        label="Service"
        value="Detailing — Full"
        icon={Wrench}
        buttonLabel="Continue"
        onContinue={jest.fn()}
      />
    );
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Detailing — Full")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i })
    ).toBeInTheDocument();
  });

  it("calls onContinue when the button is clicked", () => {
    const onContinue = jest.fn();
    render(
      <ContinueBar
        label="x"
        value="y"
        icon={Wrench}
        buttonLabel="Next"
        onContinue={onContinue}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("disables the button when disabled=true", () => {
    const onContinue = jest.fn();
    render(
      <ContinueBar
        label="x"
        value="y"
        icon={Wrench}
        buttonLabel="Next"
        onContinue={onContinue}
        disabled
      />
    );
    const btn = screen.getByRole("button", { name: /next/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onContinue).not.toHaveBeenCalled();
  });
});
