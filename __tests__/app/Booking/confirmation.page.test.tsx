/**
 * Tests for src/app/(main)/Booking/confirmation/page.tsx
 *
 * Standards coverage:
 * - 📋 Functional: missing `?ref` short-circuits to the "Invalid
 *   Confirmation Link" branch (no card / no next-steps copy); with `ref`
 *   shows the booking reference + 3-step "What Happens Next?" list +
 *   quick actions linking to `/Booking/lookup?ref=<ref>` and `/BrowseFleet`;
 *   `?email` shows up in the confirmation-email copy when supplied,
 *   otherwise falls back to a generic "your email address" line
 * - 🎯 Usability: contact card prefers `bookingsEmail`, falls back to
 *   `email`; tel: + mailto: links use the businessInfo values
 */
import { render, screen } from "@testing-library/react";

const mockGetBusinessInfo = jest.fn();
jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));

import BookingConfirmationPage from "@/app/(main)/Booking/confirmation/page";

const baseInfo = {
  phone: "0113 468 9292",
  email: "hello@example.test",
  bookingsEmail: "bookings@example.test",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBusinessInfo.mockResolvedValue(baseInfo);
});

describe("Booking confirmation page", () => {
  it("📋 missing ?ref → 'Invalid Confirmation Link' fallback with /BrowseFleet CTA", async () => {
    const ui = await BookingConfirmationPage({
      searchParams: Promise.resolve({}),
    });
    render(ui);
    expect(screen.getByText(/invalid confirmation link/i)).toBeInTheDocument();
    expect(screen.getByText(/this confirmation link is invalid/i)).toBeInTheDocument();
    const cta = screen.getByText(/browse our fleet/i).closest("a");
    expect(cta).toHaveAttribute("href", "/BrowseFleet");
    // Success-state copy must NOT appear.
    expect(screen.queryByText(/booking confirmed/i)).not.toBeInTheDocument();
  });

  it("📋 with ?ref → reference + success header + quick-action links", async () => {
    const ui = await BookingConfirmationPage({
      searchParams: Promise.resolve({ ref: "VB-XYZ-001" }),
    });
    render(ui);
    expect(screen.getByText(/booking confirmed!/i)).toBeInTheDocument();
    expect(screen.getByText("VB-XYZ-001")).toBeInTheDocument();
    const details = screen.getByText(/view booking details/i).closest("a");
    expect(details).toHaveAttribute("href", "/Booking/lookup?ref=VB-XYZ-001");
    const browse = screen.getByText(/browse more cars/i).closest("a");
    expect(browse).toHaveAttribute("href", "/BrowseFleet");
  });

  it("📋 with ?email → 'sent to <email>' copy; without, falls back to generic line", async () => {
    const withEmail = await BookingConfirmationPage({
      searchParams: Promise.resolve({ ref: "X", email: "alice@example.test" }),
    });
    const { rerender } = render(withEmail);
    expect(
      screen.getByText(/sent to alice@example\.test/i)
    ).toBeInTheDocument();

    const withoutEmail = await BookingConfirmationPage({
      searchParams: Promise.resolve({ ref: "X" }),
    });
    rerender(withoutEmail);
    expect(
      screen.getByText(/sent to your email address/i)
    ).toBeInTheDocument();
  });

  it("🎯 contact card prefers bookingsEmail; falls back to email when missing", async () => {
    const ui = await BookingConfirmationPage({
      searchParams: Promise.resolve({ ref: "X" }),
    });
    const { rerender } = render(ui);
    const bookingsAnchor = screen
      .getByText("bookings@example.test")
      .closest("a");
    expect(bookingsAnchor).toHaveAttribute(
      "href",
      "mailto:bookings@example.test"
    );

    mockGetBusinessInfo.mockResolvedValue({
      ...baseInfo,
      bookingsEmail: undefined,
    });
    const fallbackUi = await BookingConfirmationPage({
      searchParams: Promise.resolve({ ref: "X" }),
    });
    rerender(fallbackUi);
    const emailAnchor = screen.getByText("hello@example.test").closest("a");
    expect(emailAnchor).toHaveAttribute("href", "mailto:hello@example.test");
  });

  it("🎯 phone in tel: link comes from businessInfo.phone", async () => {
    const ui = await BookingConfirmationPage({
      searchParams: Promise.resolve({ ref: "X" }),
    });
    render(ui);
    const phoneLink = screen.getByText("0113 468 9292").closest("a");
    expect(phoneLink).toHaveAttribute("href", "tel:0113 468 9292");
  });

  it("📋 'What Happens Next?' renders all 3 numbered steps", async () => {
    const ui = await BookingConfirmationPage({
      searchParams: Promise.resolve({ ref: "X" }),
    });
    render(ui);
    expect(screen.getByText(/confirmation email sent/i)).toBeInTheDocument();
    expect(screen.getByText(/prepare for your visit/i)).toBeInTheDocument();
    expect(screen.getByText(/arrive on time/i)).toBeInTheDocument();
  });
});
