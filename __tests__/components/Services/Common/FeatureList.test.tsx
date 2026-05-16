/**
 * Tests for src/components/Services/Common/FeatureList.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import FeatureList from "@/components/Services/Common/FeatureList";

describe("FeatureList", () => {
  it("renders one row per feature", () => {
    render(
      <FeatureList features={["Hand wash", "Polish", "Interior vacuum"]} />
    );
    expect(screen.getByText("Hand wash")).toBeInTheDocument();
    expect(screen.getByText("Polish")).toBeInTheDocument();
    expect(screen.getByText("Interior vacuum")).toBeInTheDocument();
  });

  it("renders the optional title", () => {
    render(
      <FeatureList title="Exterior" features={["Hand wash"]} />
    );
    expect(screen.getByText("Exterior")).toBeInTheDocument();
  });

  it("applies highlight styling to features starting with the highlightPrefix", () => {
    const { container } = render(
      <FeatureList
        features={["Hand wash", "★ Premium polish"]}
        highlightPrefix="★"
      />
    );
    // The highlighted feature gets the accent-coloured icon background.
    expect(container.innerHTML).toContain("bg-red-500/20");
  });

  it("doesn't highlight when no highlightPrefix is supplied", () => {
    const { container } = render(
      <FeatureList features={["Hand wash"]} />
    );
    expect(container.innerHTML).not.toContain("bg-red-500/20");
  });
});
