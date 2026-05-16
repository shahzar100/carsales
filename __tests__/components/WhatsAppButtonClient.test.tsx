/**
 * Tests for src/components/WhatsAppButtonClient.tsx
 *
 * Standards coverage:
 * - 🔒 Security/Privacy: the wa.me URL the customer sees must not carry
 *   our query string or hash (Day 9 / Fix 9.2 — small PII/search-history
 *   leak); E.164 normalisation of the UK number ("0..." → "44...")
 * - 📋 Functional: never renders on /admin/* or /confirmation paths;
 *   context-aware message — generic on non-car pages, deep-linked on
 *   /BrowseFleet/<id>
 * - 🎯 Usability: aria-label "Chat with us on WhatsApp"; opens in a new tab
 */
import React from "react";
import { render, screen } from "@testing-library/react";

let pathnameValue: string | null = "/";
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => pathnameValue,
}));

import WhatsAppButtonClient from "@/components/WhatsAppButtonClient";

beforeEach(() => {
  pathnameValue = "/";
});

describe("WhatsAppButtonClient", () => {
  it("renders the WhatsApp link with aria-label and external attributes", () => {
    render(
      <WhatsAppButtonClient phone="0113 468 9292" businessName="MMC" />
    );
    const link = screen.getByRole("link", {
      name: /chat with us on whatsapp/i,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("📋 hides on /admin/* paths", () => {
    pathnameValue = "/admin/dashboard";
    const { container } = render(
      <WhatsAppButtonClient phone="0113 468 9292" businessName="MMC" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("📋 hides on /confirmation paths (post-funnel)", () => {
    pathnameValue = "/Booking/confirmation";
    const { container } = render(
      <WhatsAppButtonClient phone="0113 468 9292" businessName="MMC" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("📋 normalises a leading-zero UK number to 44... in the wa.me href", () => {
    render(
      <WhatsAppButtonClient phone="0113 468 9292" businessName="MMC" />
    );
    const link = screen.getByRole("link", {
      name: /chat with us on whatsapp/i,
    });
    expect(link.getAttribute("href")).toContain("https://wa.me/441134689292");
  });

  it("📋 leaves a non-leading-zero number as digits only", () => {
    render(
      <WhatsAppButtonClient phone="+44 113 468 9292" businessName="MMC" />
    );
    const link = screen.getByRole("link", {
      name: /chat with us on whatsapp/i,
    });
    expect(link.getAttribute("href")).toContain("https://wa.me/441134689292");
  });

  it("📋 includes a context-aware deep-link message on /BrowseFleet/<id>", () => {
    pathnameValue = "/BrowseFleet/abc-123";
    render(
      <WhatsAppButtonClient phone="0113 468 9292" businessName="MMC" />
    );
    const link = screen.getByRole("link", {
      name: /chat with us on whatsapp/i,
    });
    const href = link.getAttribute("href")!;
    const text = decodeURIComponent(
      new URL(href).searchParams.get("text") ?? ""
    );
    expect(text).toMatch(/I'm interested in this car/);
    expect(text).toMatch(/Hi MMC/);
  });

  it("📋 generic message on any non-car page", () => {
    pathnameValue = "/AboutUs";
    render(
      <WhatsAppButtonClient phone="0113 468 9292" businessName="MMC" />
    );
    const text = decodeURIComponent(
      new URL(
        screen.getByRole("link").getAttribute("href")!
      ).searchParams.get("text") ?? ""
    );
    expect(text).toMatch(/I have a question about your services/);
  });

  it("🔒 the deep-link URL strips query strings and hash from the current URL", () => {
    pathnameValue = "/BrowseFleet/abc-123";
    // jsdom default location is about:blank — push a real URL via JSDOM's
    // location patch.
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: new URL(
        "https://example.com/BrowseFleet/abc-123?utm_source=mailchimp&campaign=spring#section"
      ),
    });

    render(
      <WhatsAppButtonClient phone="0113 468 9292" businessName="MMC" />
    );
    const text = decodeURIComponent(
      new URL(
        screen.getByRole("link").getAttribute("href")!
      ).searchParams.get("text") ?? ""
    );
    // The pasted URL inside the WhatsApp message must NOT carry the
    // utm_* params or the hash.
    expect(text).toContain("https://example.com/BrowseFleet/abc-123");
    expect(text).not.toContain("utm_source");
    expect(text).not.toContain("#section");

    // Restore
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });
});
