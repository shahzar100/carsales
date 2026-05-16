/**
 * Tests for src/components/Services/Common/BackNavigation.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import BackNavigation from "@/components/Services/Common/BackNavigation";

describe("BackNavigation", () => {
  it("renders a link with the supplied href and text", () => {
    render(<BackNavigation href="/Services" text="Back to services" />);
    const link = screen.getByText("Back to services").closest("a");
    expect(link).toHaveAttribute("href", "/Services");
  });

  it("includes a leading arrow icon", () => {
    const { container } = render(
      <BackNavigation href="/" text="Home" />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
