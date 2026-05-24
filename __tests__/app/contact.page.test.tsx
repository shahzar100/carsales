/**
 * Tests for src/app/(main)/contact/page.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders hero, contact cards (phone/email/visit), and
 *   the opening-hours table. Threads businessInfo (phone, email,
 *   bookingsEmail, address, hours, googleMapsUrl) through correctly.
 * - 🔒 Security: only `https:` googleMapsUrl is honoured; otherwise falls
 *   back to the computed maps.google.com URL.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetBusinessInfo = jest.fn();

jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));

jest.mock("@/components/Services/Common", () => ({
  BlackRedSection: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="black-red">{children}</section>
  ),
}));

const baseInfo = {
  phone: "0113 999 0000",
  email: "hello@example.com",
  bookingsEmail: "book@example.com",
  address: "Test St",
  city: "Leeds",
  state: "WY",
  zipCode: "LS1 1AA",
  googleMapsUrl: "https://maps.google.com/?q=Test",
  hours: {
    monday: "9-5",
    tuesday: "9-5",
    wednesday: "9-5",
    thursday: "9-5",
    friday: "9-5",
    saturday: "10-2",
    sunday: "Closed",
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBusinessInfo.mockResolvedValue(baseInfo);
});

describe("(main)/contact page", () => {
  it("📋 hero shows the Let's Talk headline + phone/email CTAs", async () => {
    const Page = (await import("@/app/(main)/contact/page")).default;
    render(await Page());

    expect(
      screen.getByRole("heading", { level: 1 }).textContent
    ).toMatch(/talk/i);
    // Phone shown more than once (hero + card).
    expect(screen.getAllByText("0113 999 0000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("hello@example.com").length).toBeGreaterThan(0);
  });

  it("📋 renders the three contact cards (Call / Email / Visit)", async () => {
    const Page = (await import("@/app/(main)/contact/page")).default;
    render(await Page());

    expect(screen.getAllByText(/call us/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Visit")).toBeInTheDocument();
  });

  it("📋 shows the bookings email row when it differs from the main email", async () => {
    const Page = (await import("@/app/(main)/contact/page")).default;
    render(await Page());

    expect(screen.getByText(/Bookings: book@example.com/i)).toBeInTheDocument();
  });

  it("📋 omits the bookings email row when it equals the primary email", async () => {
    mockGetBusinessInfo.mockResolvedValue({
      ...baseInfo,
      bookingsEmail: baseInfo.email,
    });
    const Page = (await import("@/app/(main)/contact/page")).default;
    render(await Page());

    expect(screen.queryByText(/^bookings:/i)).not.toBeInTheDocument();
  });

  it("🔒 uses the admin https:// googleMapsUrl when valid", async () => {
    const Page = (await import("@/app/(main)/contact/page")).default;
    render(await Page());

    const visitLinks = screen.getAllByText(/test st, leeds/i);
    const link = visitLinks.find((el) => el.tagName === "A");
    expect(link).toHaveAttribute("href", "https://maps.google.com/?q=Test");
  });

  it("🔒 falls back to the computed maps URL when admin URL is unsafe", async () => {
    mockGetBusinessInfo.mockResolvedValue({
      ...baseInfo,
      googleMapsUrl: "javascript:alert(1)",
    });
    const Page = (await import("@/app/(main)/contact/page")).default;
    render(await Page());

    const link = screen
      .getAllByText(/test st, leeds/i)
      .find((el) => el.tagName === "A") as HTMLAnchorElement;
    expect(link.href).toMatch(/^https:\/\/maps\.google\.com\//);
    // Encoded full address used by the fallback.
    expect(link.href).toContain(encodeURIComponent("Test St, Leeds, WY LS1 1AA"));
  });

  it("📋 renders one row per day with the corresponding hours value", async () => {
    const Page = (await import("@/app/(main)/contact/page")).default;
    render(await Page());

    expect(screen.getByText(/monday/i)).toBeInTheDocument();
    expect(screen.getByText(/saturday/i)).toBeInTheDocument();
    expect(screen.getByText(/sunday/i)).toBeInTheDocument();
    expect(screen.getByText("10-2")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("📋 Quick Links section links to /BrowseFleet, /Services, /Recoveries", async () => {
    const Page = (await import("@/app/(main)/contact/page")).default;
    const { container } = render(await Page());

    expect(container.querySelector("a[href='/BrowseFleet']")).toBeInTheDocument();
    expect(container.querySelector("a[href='/Services']")).toBeInTheDocument();
    expect(container.querySelector("a[href='/Recoveries']")).toBeInTheDocument();
  });
});
