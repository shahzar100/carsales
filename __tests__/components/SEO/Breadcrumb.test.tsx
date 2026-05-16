/**
 * Tests for src/components/SEO/Breadcrumb.tsx
 *
 * Standards coverage:
 * - 🔒 SEO: schema.org BreadcrumbList JSON-LD; relative paths get
 *   prefixed with NEXT_PUBLIC_SITE_URL so Google sees absolute URLs;
 *   absolute URLs pass through untouched
 * - 📋 Functional: positions are 1-indexed in the order supplied (root
 *   → current page)
 */
import React from "react";
import { render } from "@testing-library/react";
import { Breadcrumb } from "@/components/SEO/Breadcrumb";

describe("Breadcrumb", () => {
  // `siteUrl` is captured at module load via
  //   `process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"`,
  // so mutating process.env from beforeEach is too late. Assert against
  // whatever the jest env setup pinned at module load.
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  function getJsonLd(container: HTMLElement) {
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    return script ? JSON.parse(script.textContent ?? "{}") : null;
  }

  it("📋 emits a BreadcrumbList JSON-LD script", () => {
    const { container } = render(
      <Breadcrumb
        items={[
          { name: "Home", url: "/" },
          { name: "Cars", url: "/BrowseFleet" },
          { name: "Tesla Model 3", url: "/BrowseFleet/abc-123" },
        ]}
      />
    );
    const data = getJsonLd(container);
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Cars",
          item: `${SITE_URL}/BrowseFleet`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Tesla Model 3",
          item: `${SITE_URL}/BrowseFleet/abc-123`,
        },
      ],
    });
  });

  it("🔒 absolute URLs pass through untouched (no double prefixing)", () => {
    const { container } = render(
      <Breadcrumb
        items={[{ name: "External", url: "https://other.example/landing" }]}
      />
    );
    const data = getJsonLd(container);
    expect(data.itemListElement[0].item).toBe(
      "https://other.example/landing"
    );
  });
});
