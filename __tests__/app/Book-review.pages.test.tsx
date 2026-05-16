/**
 * Tests for:
 *   src/app/(main)/Book/page.tsx
 *   src/app/(main)/review/page.tsx
 *
 * Standards coverage:
 * - 📋 Functional: Book page threads businessInfo's detailingPackages +
 *   tintOptions into BookingFlow; review page validates ?ref shape and
 *   prefers Google maps URL over /contact fallback
 * - 🔒 Security: review page rejects malformed refs and shows an error
 *   branch instead of leaking the review CTA
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetBusinessInfo = jest.fn();
const mockValidateRef = jest.fn();

jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));
jest.mock("@/lib/utils/validation", () => ({
  validateBookingReference: (r: string) => mockValidateRef(r),
}));

// Stub the heavy children.
let flowProps: any = null;
jest.mock("@/components/Booking/Flow/BookingFlow", () => ({
  __esModule: true,
  default: (props: unknown) => {
    flowProps = props;
    return <div data-testid="booking-flow" />;
  },
}));
jest.mock("@/components/Account/BookingAuthGate", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-gate">{children}</div>
  ),
}));

// Book/page.tsx imports "./booking-flow.css" — Jest can't load CSS, so
// fence it off via the moduleNameMapper-style stub:
jest.mock("@/app/(main)/Book/booking-flow.css", () => ({}), { virtual: true });

beforeEach(() => {
  jest.clearAllMocks();
  flowProps = null;
});

// ── (main)/Book ─────────────────────────────────────────────
describe("(main)/Book page", () => {
  it("📋 threads detailingPackages + tintOptions from businessInfo into BookingFlow", async () => {
    mockGetBusinessInfo.mockResolvedValue({
      detailingPackages: [{ id: "mini", name: "Mini Valet" }],
      tintOptions: [{ name: "Standard Film" }],
    });
    const Page = (await import("@/app/(main)/Book/page")).default;
    const ui = await Page();
    render(ui);
    expect(screen.getByTestId("auth-gate")).toBeInTheDocument();
    expect(screen.getByTestId("booking-flow")).toBeInTheDocument();
    expect(flowProps).toEqual({
      detailingPackages: [{ id: "mini", name: "Mini Valet" }],
      tintOptions: [{ name: "Standard Film" }],
    });
  });

  it("🎯 missing detailingPackages/tintOptions → empty arrays (no crash)", async () => {
    mockGetBusinessInfo.mockResolvedValue({});
    const Page = (await import("@/app/(main)/Book/page")).default;
    const ui = await Page();
    render(ui);
    expect(flowProps).toEqual({
      detailingPackages: [],
      tintOptions: [],
    });
  });
});

// ── (main)/review ───────────────────────────────────────────
describe("(main)/review page", () => {
  it("🔒 missing ?ref → error branch with /contact fallback when no maps URL", async () => {
    mockValidateRef.mockReturnValue(true); // unused — undefined ref short-circuits first
    mockGetBusinessInfo.mockResolvedValue({}); // no googleMapsUrl
    const Page = (await import("@/app/(main)/review/page")).default;
    const ui = await Page({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(
      screen.getByText(/couldn't find that review link/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/contact us/i).closest("a")).toHaveAttribute(
      "href",
      "/contact"
    );
  });

  it("🔒 malformed ?ref → error branch + Google maps fallback when present", async () => {
    mockValidateRef.mockReturnValue(false);
    mockGetBusinessInfo.mockResolvedValue({
      googleMapsUrl: "https://maps.example/morley",
    });
    const Page = (await import("@/app/(main)/review/page")).default;
    const ui = await Page({
      searchParams: Promise.resolve({ ref: "bogus" }),
    });
    render(ui);
    expect(
      screen.getByText(/couldn't find that review link/i)
    ).toBeInTheDocument();
    const googleCta = screen.getByText(/leave a google review/i).closest("a");
    expect(googleCta).toHaveAttribute("href", "https://maps.example/morley");
    expect(googleCta).toHaveAttribute("target", "_blank");
  });

  it("📋 valid ?ref → full review CTA includes the ref + Google link", async () => {
    mockValidateRef.mockReturnValue(true);
    mockGetBusinessInfo.mockResolvedValue({
      googleMapsUrl: "https://maps.example/morley",
    });
    const Page = (await import("@/app/(main)/review/page")).default;
    const ui = await Page({
      searchParams: Promise.resolve({ ref: "MMC-ABC123" }),
    });
    render(ui);
    expect(screen.getByText(/thank you for choosing us/i)).toBeInTheDocument();
    expect(screen.getByText("MMC-ABC123")).toBeInTheDocument();
    const googleCta = screen.getByText(/leave a google review/i).closest("a");
    expect(googleCta).toHaveAttribute("href", "https://maps.example/morley");
  });

  it("📋 valid ?ref without maps URL → 'Contact us with feedback' fallback", async () => {
    mockValidateRef.mockReturnValue(true);
    mockGetBusinessInfo.mockResolvedValue({});
    const Page = (await import("@/app/(main)/review/page")).default;
    const ui = await Page({
      searchParams: Promise.resolve({ ref: "MMC-ABC123" }),
    });
    render(ui);
    const fallback = screen
      .getByText(/contact us with feedback/i)
      .closest("a");
    expect(fallback).toHaveAttribute("href", "/contact");
    expect(
      screen.queryByText(/leave a google review/i)
    ).not.toBeInTheDocument();
  });
});
