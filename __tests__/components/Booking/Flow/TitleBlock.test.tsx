/**
 * Tests for src/components/Booking/Flow/TitleBlock.tsx
 *
 * Standards coverage:
 * - 📋 Functional: eyebrow + title always render; subtitle optional;
 *   prefill chip only shows when prefillLabel is supplied; "change"
 *   button only shows when onPrefillChange is supplied
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TitleBlock from "@/components/Booking/Flow/TitleBlock";

describe("TitleBlock", () => {
  it("renders the eyebrow and title", () => {
    render(<TitleBlock eyebrow="Step 1" title="Pick a service" />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Pick a service")).toBeInTheDocument();
  });

  it("renders the subtitle when supplied", () => {
    render(
      <TitleBlock
        eyebrow="x"
        title="y"
        subtitle="Long explanatory copy here."
      />
    );
    expect(
      screen.getByText("Long explanatory copy here.")
    ).toBeInTheDocument();
  });

  it("hides the prefill chip when prefillLabel is not supplied", () => {
    render(<TitleBlock eyebrow="x" title="y" />);
    expect(screen.queryByText(/continuing from/i)).not.toBeInTheDocument();
  });

  it("renders the prefill chip with the supplied label", () => {
    render(
      <TitleBlock eyebrow="x" title="y" prefillLabel="Tesla Model 3" />
    );
    expect(screen.getByText(/continuing from/i)).toBeInTheDocument();
    expect(screen.getByText("Tesla Model 3")).toBeInTheDocument();
  });

  it("📋 renders a 'change' button only when onPrefillChange is supplied", () => {
    const { rerender } = render(
      <TitleBlock eyebrow="x" title="y" prefillLabel="Tesla Model 3" />
    );
    expect(
      screen.queryByRole("button", { name: /change/i })
    ).not.toBeInTheDocument();

    const onPrefillChange = jest.fn();
    rerender(
      <TitleBlock
        eyebrow="x"
        title="y"
        prefillLabel="Tesla Model 3"
        onPrefillChange={onPrefillChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /change/i }));
    expect(onPrefillChange).toHaveBeenCalledTimes(1);
  });

  it("accepts ReactNode for title and subtitle, not just strings", () => {
    render(
      <TitleBlock
        eyebrow="x"
        title={<span data-testid="title-node">Composed title</span>}
        subtitle={<em data-testid="sub-node">Composed subtitle</em>}
      />
    );
    expect(screen.getByTestId("title-node")).toBeInTheDocument();
    expect(screen.getByTestId("sub-node")).toBeInTheDocument();
  });
});
