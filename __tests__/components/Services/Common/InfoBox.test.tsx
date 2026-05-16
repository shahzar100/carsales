/**
 * Tests for src/components/Services/Common/InfoBox.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import InfoBox from "@/components/Services/Common/InfoBox";

describe("InfoBox", () => {
  it("renders one row per entry with label + value", () => {
    render(
      <InfoBox
        rows={[
          { label: "Duration", value: "1 hour" },
          { label: "Price", value: "£59" },
          { label: "Slots", value: "Mon–Sat" },
        ]}
      />
    );
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("1 hour")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("£59")).toBeInTheDocument();
    expect(screen.getByText("Slots")).toBeInTheDocument();
    expect(screen.getByText("Mon–Sat")).toBeInTheDocument();
  });

  it("handles an empty rows array without crashing", () => {
    const { container } = render(<InfoBox rows={[]} />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});
