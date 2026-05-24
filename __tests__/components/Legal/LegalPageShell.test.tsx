/**
 * Tests for src/components/Legal/LegalPageShell.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders titleLead + titleAccent, eyebrow icon+label,
 *   intro paragraph, last-updated stamp, each section's title + body,
 *   and footer-CTA title/body/actions in a stable order.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Shield } from "lucide-react";
import LegalPageShell, {
  type LegalSection,
} from "@/components/Legal/LegalPageShell";

const sections: LegalSection[] = [
  {
    title: "1. Scope",
    body: <p data-testid="body-1">scope body</p>,
  },
  {
    title: "2. Liability",
    body: <p data-testid="body-2">liability body</p>,
  },
];

describe("LegalPageShell", () => {
  it("📋 renders title lead + accent inside the h1", () => {
    render(
      <LegalPageShell
        titleLead="Privacy"
        titleAccent="Policy"
        eyebrow={{ icon: Shield, label: "Your Privacy Matters" }}
        intro="Intro copy"
        lastUpdated="March 2026"
        sections={sections}
        footerCta={{
          title: "Questions?",
          body: "Get in touch",
          actions: <button>Contact</button>,
        }}
      />
    );

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent?.replace(/\s+/g, " ").trim()).toBe(
      "Privacy Policy"
    );
  });

  it("📋 renders eyebrow label, intro paragraph, and last-updated stamp", () => {
    render(
      <LegalPageShell
        titleLead="Privacy"
        titleAccent="Policy"
        eyebrow={{ icon: Shield, label: "Your Privacy Matters" }}
        intro="Intro copy here"
        lastUpdated="March 2026"
        sections={sections}
        footerCta={{ title: "T", body: "B", actions: null }}
      />
    );

    expect(screen.getByText("Your Privacy Matters")).toBeInTheDocument();
    expect(screen.getByText("Intro copy here")).toBeInTheDocument();
    expect(screen.getByText(/march 2026/i)).toBeInTheDocument();
  });

  it("📋 renders each section's title (h2) and body in order", () => {
    render(
      <LegalPageShell
        titleLead="X"
        titleAccent="Y"
        eyebrow={{ icon: Shield, label: "e" }}
        intro="i"
        lastUpdated="2026"
        sections={sections}
        footerCta={{ title: "T", body: "B", actions: null }}
      />
    );

    const h2s = screen.getAllByRole("heading", { level: 2 });
    // Last h2 is the footer-CTA title — first two are sections.
    expect(h2s[0]).toHaveTextContent("1. Scope");
    expect(h2s[1]).toHaveTextContent("2. Liability");
    expect(screen.getByTestId("body-1")).toBeInTheDocument();
    expect(screen.getByTestId("body-2")).toBeInTheDocument();
  });

  it("📋 footer-CTA renders title, body, and actions slot", () => {
    render(
      <LegalPageShell
        titleLead="X"
        titleAccent="Y"
        eyebrow={{ icon: Shield, label: "e" }}
        intro="i"
        lastUpdated="2026"
        sections={[]}
        footerCta={{
          title: "Need Help?",
          body: "We're here for you",
          actions: <a href="/contact">Contact</a>,
        }}
      />
    );

    expect(screen.getByText("Need Help?")).toBeInTheDocument();
    expect(screen.getByText("We're here for you")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /contact/i })
    ).toHaveAttribute("href", "/contact");
  });

  it("📋 empty sections array renders the shell without any section h2s", () => {
    render(
      <LegalPageShell
        titleLead="A"
        titleAccent="B"
        eyebrow={{ icon: Shield, label: "e" }}
        intro="i"
        lastUpdated="2026"
        sections={[]}
        footerCta={{ title: "T", body: "B", actions: null }}
      />
    );

    // Only the footer-CTA h2 exists.
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });
});
