/**
 * Tests for src/components/Services/Common/ContactSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders title + subtitle, primary actions as anchors
 *   (mailto / tel / Link), secondary actions only render when provided,
 *   action style maps to expected classes (primary=green, danger=red,
 *   secondary=transparent border).
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ContactSection from "@/components/Services/Common/ContactSection";

describe("ContactSection", () => {
  it("📋 renders title + subtitle and each primary action anchor", () => {
    render(
      <ContactSection
        title="Get In Touch"
        subtitle="We'd love to hear from you"
        primaryActions={[
          {
            type: "email",
            url: "mailto:hello@example.com",
            text: "Email Us",
            style: "primary",
          },
          {
            type: "phone",
            url: "tel:0123",
            text: "Call Us",
            style: "danger",
          },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { name: /get in touch/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/we'd love to hear/i)).toBeInTheDocument();
    expect(screen.getByText("Email Us").closest("a")).toHaveAttribute(
      "href",
      "mailto:hello@example.com"
    );
    expect(screen.getByText("Call Us").closest("a")).toHaveAttribute(
      "href",
      "tel:0123"
    );
  });

  it("📋 type='link' renders a next/link anchor (still <a> in DOM)", () => {
    render(
      <ContactSection
        title="T"
        subtitle="S"
        primaryActions={[
          {
            type: "link",
            url: "/BrowseFleet",
            text: "Browse",
            style: "primary",
          },
        ]}
      />
    );

    expect(screen.getByText("Browse").closest("a")).toHaveAttribute(
      "href",
      "/BrowseFleet"
    );
  });

  it("📋 secondary actions only render when provided", () => {
    const { rerender } = render(
      <ContactSection
        title="T"
        subtitle="S"
        primaryActions={[]}
        secondaryActions={[
          { type: "link", url: "/x", text: "Second", style: "secondary" },
        ]}
      />
    );
    expect(screen.getByText("Second")).toBeInTheDocument();

    rerender(<ContactSection title="T" subtitle="S" primaryActions={[]} />);
    expect(screen.queryByText("Second")).not.toBeInTheDocument();
  });

  it("📋 style → class mapping (primary=green, danger=red, secondary=border)", () => {
    render(
      <ContactSection
        title="T"
        subtitle="S"
        primaryActions={[
          {
            type: "email",
            url: "mailto:a",
            text: "Primary",
            style: "primary",
          },
          {
            type: "email",
            url: "mailto:d",
            text: "Danger",
            style: "danger",
          },
        ]}
        secondaryActions={[
          {
            type: "link",
            url: "/y",
            text: "Secondary",
            style: "secondary",
          },
        ]}
      />
    );

    expect(screen.getByText("Primary").className).toMatch(/bg-green-600/);
    expect(screen.getByText("Danger").className).toMatch(/bg-red-700/);
    expect(screen.getByText("Secondary").className).toMatch(
      /bg-transparent/
    );
  });

  it("📋 backgroundColor/textColor overrides flow into the wrapper className", () => {
    const { container } = render(
      <ContactSection
        title="T"
        subtitle="S"
        primaryActions={[]}
        backgroundColor="bg-black"
        textColor="text-white"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/bg-black/);
    expect(wrapper.className).toMatch(/text-white/);
  });
});
