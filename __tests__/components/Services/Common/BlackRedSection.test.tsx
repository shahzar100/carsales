/**
 * Tests for src/components/Services/Common/BlackRedSection.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import BlackRedSection from "@/components/Services/Common/BlackRedSection";

describe("BlackRedSection", () => {
  it("renders children inside the section", () => {
    render(
      <BlackRedSection>
        <p data-testid="inner">hello</p>
      </BlackRedSection>
    );
    expect(screen.getByTestId("inner")).toBeInTheDocument();
  });

  it("applies the supplied className alongside its own", () => {
    const { container } = render(
      <BlackRedSection className="custom-class">
        <span />
      </BlackRedSection>
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("custom-class");
    expect(root.className).toContain("bg-black");
  });
});
