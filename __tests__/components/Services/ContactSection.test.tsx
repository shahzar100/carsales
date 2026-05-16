/**
 * Tests for src/components/Services/Common/ContactSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: each `ContactAction` type renders the right element
 *   (`link` → next/link, `email`/`phone` → plain `<a href="mailto:..."`
 *   or `tel:..."`); per-style colour class wiring; primary uses green,
 *   secondary uses gray-border, danger uses red, default fallback gray;
 *   secondary block only renders when `secondaryActions` is supplied
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ContactSection from "@/components/Services/Common/ContactSection";

describe("ContactSection", () => {
  it("📋 renders title + subtitle copy", () => {
    render(
      <ContactSection
        title="Need help?"
        subtitle="We're here to help"
        primaryActions={[]}
      />
    );
    expect(
      screen.getByRole("heading", { name: /need help/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/we're here to help/i)).toBeInTheDocument();
  });

  it("📋 link-type action → next/link with href + label", () => {
    render(
      <ContactSection
        title="t"
        subtitle="s"
        primaryActions={[
          {
            type: "link",
            url: "/contact",
            text: "Open Contact Form",
            style: "primary",
          },
        ]}
      />
    );
    const a = screen.getByText("Open Contact Form").closest("a");
    expect(a).toHaveAttribute("href", "/contact");
    // Primary inside primary block → green pill.
    expect(a?.className).toContain("bg-green-600");
  });

  it("📋 email/phone action → plain anchor with mailto/tel href", () => {
    render(
      <ContactSection
        title="t"
        subtitle="s"
        primaryActions={[
          {
            type: "email",
            url: "mailto:hello@example.test",
            text: "Email",
            style: "primary",
          },
          {
            type: "phone",
            url: "tel:01134689292",
            text: "Call us",
            style: "danger",
          },
        ]}
      />
    );
    expect(screen.getByText("Email").closest("a")).toHaveAttribute(
      "href",
      "mailto:hello@example.test"
    );
    const callLink = screen.getByText("Call us").closest("a");
    expect(callLink).toHaveAttribute("href", "tel:01134689292");
    // Danger style picks the red pill.
    expect(callLink?.className).toContain("bg-red-700");
  });

  it("🎯 secondary block only renders when secondaryActions is supplied", () => {
    const { rerender } = render(
      <ContactSection
        title="t"
        subtitle="s"
        primaryActions={[
          { type: "link", url: "/x", text: "Primary", style: "primary" },
        ]}
      />
    );
    expect(screen.queryByText("Secondary")).not.toBeInTheDocument();

    rerender(
      <ContactSection
        title="t"
        subtitle="s"
        primaryActions={[
          { type: "link", url: "/x", text: "Primary", style: "primary" },
        ]}
        secondaryActions={[
          { type: "link", url: "/y", text: "Secondary", style: "secondary" },
          { type: "link", url: "/z", text: "Outside", style: "primary" },
        ]}
      />
    );
    // Secondary action with style=secondary uses the gray-border variant.
    const sec = screen.getByText("Secondary").closest("a");
    expect(sec?.className).toContain("border-gray-600");
    // Secondary block's "primary"-styled action falls through to the
    // dark gray pill (not green).
    const outside = screen.getByText("Outside").closest("a");
    expect(outside?.className).toContain("bg-gray-700");
  });

  it("📋 unknown style falls back to the gray pill", () => {
    render(
      <ContactSection
        title="t"
        subtitle="s"
        primaryActions={[
          // Force-cast through unknown to exercise the default branch.
          {
            type: "link",
            url: "/x",
            text: "Mystery",
            style: "unknown" as unknown as "primary",
          },
        ]}
      />
    );
    const a = screen.getByText("Mystery").closest("a");
    expect(a?.className).toContain("bg-gray-600");
  });
});
