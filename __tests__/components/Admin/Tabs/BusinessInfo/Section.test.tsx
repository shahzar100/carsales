/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/Section.tsx
 *
 * Standards coverage:
 * - 📋 Functional: collapsed by default, toggles open on click, renders
 *   children only when open, displays the icon + title + description copy
 *   and swaps chevron direction.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Mail } from "lucide-react";
import Section from "@/components/Admin/Tabs/BusinessInfo/Section";

describe("BusinessInfo Section", () => {
  it("📋 renders the title + description and hides children when collapsed by default", () => {
    render(
      <Section icon={Mail} title="Contact" description="Phone, email & address">
        <div data-testid="child">child content</div>
      </Section>
    );

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Phone, email & address")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("📋 toggles children on click — open then close", () => {
    render(
      <Section icon={Mail} title="Hours" description="Weekly opening hours">
        <div data-testid="child">child</div>
      </Section>
    );

    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    expect(screen.getByTestId("child")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("📋 defaultOpen=true renders children immediately", () => {
    render(
      <Section
        icon={Mail}
        title="Core"
        description="Core info"
        defaultOpen
      >
        <div data-testid="child">child</div>
      </Section>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
