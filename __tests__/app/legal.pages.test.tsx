/**
 * Tests for src/app/(main)/privacy/page.tsx and src/app/(main)/terms/page.tsx
 *
 * Standards coverage:
 * - 📋 Functional: both pages forward businessInfo through to the shared
 *   LegalPageShell (title accent words, eyebrow label, last-updated stamp,
 *   section list, footer-CTA buttons). Contact-section body embeds the
 *   address, email, and phone from getBusinessInfo.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetBusinessInfo = jest.fn();

jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));

let shellProps: any = null;
jest.mock("@/components/Legal/LegalPageShell", () => ({
  __esModule: true,
  default: (props: any) => {
    shellProps = props;
    return (
      <div data-testid="legal-shell">
        <h1>
          {props.titleLead} {props.titleAccent}
        </h1>
        <p data-testid="eyebrow">{props.eyebrow.label}</p>
        <p data-testid="intro">{props.intro}</p>
        <p data-testid="last-updated">{props.lastUpdated}</p>
        {props.sections.map((s: any, i: number) => (
          <section key={i} data-testid="section">
            <h2>{s.title}</h2>
            <div>{s.body}</div>
          </section>
        ))}
        <div data-testid="footer-actions">{props.footerCta.actions}</div>
      </div>
    );
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  shellProps = null;
  mockGetBusinessInfo.mockResolvedValue({
    businessName: "MMC Leeds",
    email: "info@mmcleeds.co.uk",
    phone: "0113 468 9292",
    address: "Roseville Road",
    city: "Leeds",
    state: "West Yorkshire",
    zipCode: "LS8 5DT",
  });
});

describe("(main)/privacy page", () => {
  it("📋 renders the Privacy/Policy hero with the matters eyebrow + last-updated stamp", async () => {
    const Page = (await import("@/app/(main)/privacy/page")).default;
    render(await Page());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /privacy\s+policy/i
    );
    expect(screen.getByTestId("eyebrow")).toHaveTextContent(
      /your privacy matters/i
    );
    expect(screen.getByTestId("last-updated")).toHaveTextContent(
      /march 2026/i
    );
  });

  it("📋 hands LegalPageShell the full 11-section list", async () => {
    const Page = (await import("@/app/(main)/privacy/page")).default;
    render(await Page());
    expect(screen.getAllByTestId("section")).toHaveLength(11);
    // Spot-check section titles in order.
    expect(shellProps.sections[0].title).toMatch(/1\. Information We Collect/);
    expect(shellProps.sections[10].title).toMatch(/11\. Contact Us/);
  });

  it("📋 final 'Contact Us' section embeds the business address + email + phone", async () => {
    const Page = (await import("@/app/(main)/privacy/page")).default;
    render(await Page());

    expect(screen.getByText(/Roseville Road, Leeds/i)).toBeInTheDocument();
    expect(screen.getAllByText(/info@mmcleeds.co.uk/i).length).toBeGreaterThan(
      0
    );
    expect(screen.getByText(/0113 468 9292/i)).toBeInTheDocument();
  });

  it("📋 footer-CTA actions include a mailto + a link to /terms", async () => {
    const Page = (await import("@/app/(main)/privacy/page")).default;
    render(await Page());

    const footer = screen.getByTestId("footer-actions");
    const mailto = footer.querySelector("a[href^=mailto]");
    expect(mailto).toHaveAttribute("href", "mailto:info@mmcleeds.co.uk");
    expect(footer.querySelector("a[href='/terms']")).toBeInTheDocument();
  });
});

describe("(main)/terms page", () => {
  it("📋 renders the Terms of/Service hero with the legal-agreement eyebrow", async () => {
    const Page = (await import("@/app/(main)/terms/page")).default;
    render(await Page());

    // Title heading wraps lead + accent.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /service/i
    );
    expect(screen.getByTestId("last-updated")).toHaveTextContent(/2026/);
  });

  it("📋 hands LegalPageShell a multi-section content array", async () => {
    const Page = (await import("@/app/(main)/terms/page")).default;
    render(await Page());

    const sections = screen.getAllByTestId("section");
    expect(sections.length).toBeGreaterThan(5);
    // First section is the introduction.
    expect(shellProps.sections[0].title).toMatch(/Introduction/i);
  });

  it("📋 introduction copy embeds the businessName + address + email + phone", async () => {
    const Page = (await import("@/app/(main)/terms/page")).default;
    render(await Page());

    expect(screen.getAllByText(/MMC Leeds/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/info@mmcleeds.co.uk/i).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(/0113 468 9292/i).length).toBeGreaterThan(0);
  });
});
