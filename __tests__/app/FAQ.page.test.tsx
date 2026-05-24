/**
 * Tests for src/app/(main)/FAQ/page.tsx
 *
 * Standards coverage:
 * - 📋 Functional: hero copy + frequently-asked-questions badge render,
 *   each FAQ category title appears, FAQAccordion receives non-empty
 *   items, contact CTA threads phone + email through from businessInfo.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetBusinessInfo = jest.fn();

jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));

// Stub heavy child — FAQAccordion is "use client" + motion-heavy.
let accordionCalls: Array<{ items: unknown[] }> = [];
jest.mock("@/components/Helpful/FAQAccordion", () => ({
  __esModule: true,
  default: ({ items }: { items: unknown[] }) => {
    accordionCalls.push({ items });
    return (
      <div data-testid="faq-accordion" data-count={items.length}>
        {items.map((it, i) => (
          <div key={i} data-testid="faq-item">
            {(it as { question: string }).question}
          </div>
        ))}
      </div>
    );
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  accordionCalls = [];
  mockGetBusinessInfo.mockResolvedValue({
    phone: "0113 999 9999",
    email: "info@example.co.uk",
    address: "1 High St",
    city: "Leeds",
    hours: {
      monday: "9-5",
      tuesday: "9-5",
      wednesday: "9-5",
      thursday: "9-5",
      friday: "9-5",
      saturday: "9-1",
      sunday: "Closed",
    },
  });
});

describe("(main)/FAQ page", () => {
  it("📋 renders hero badge + heading", async () => {
    const Page = (await import("@/app/(main)/FAQ/page")).default;
    const ui = await Page();
    render(ui);

    expect(
      screen.getByText(/frequently asked questions/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /how can we/i
    );
  });

  it("📋 renders all five FAQ category headings", async () => {
    const Page = (await import("@/app/(main)/FAQ/page")).default;
    render(await Page());

    expect(screen.getByText("Buying a Vehicle")).toBeInTheDocument();
    expect(screen.getByText("Services & Repairs")).toBeInTheDocument();
    expect(screen.getByText("Breakdown Recovery")).toBeInTheDocument();
    expect(screen.getByText("Payments & Booking")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("📋 hands each category a non-empty items array to FAQAccordion", async () => {
    const Page = (await import("@/app/(main)/FAQ/page")).default;
    render(await Page());

    // 5 categories → 5 accordions.
    const accordions = screen.getAllByTestId("faq-accordion");
    expect(accordions).toHaveLength(5);
    accordions.forEach((a) =>
      expect(Number(a.getAttribute("data-count"))).toBeGreaterThan(0)
    );
  });

  it("📋 threads phone + email from businessInfo into the bottom CTA", async () => {
    const Page = (await import("@/app/(main)/FAQ/page")).default;
    render(await Page());

    const phoneLink = screen.getByText("0113 999 9999").closest("a");
    expect(phoneLink).toHaveAttribute("href", "tel:0113 999 9999");

    const contact = screen.getByText(/contact us/i).closest("a");
    expect(contact).toHaveAttribute("href", "/contact");
  });

  it("📋 General-section answers embed the address + opening hours", async () => {
    const Page = (await import("@/app/(main)/FAQ/page")).default;
    render(await Page());

    // The "Where are you located?" question is fed to its accordion.
    const generalItems = accordionCalls[4].items as Array<{
      question: string;
      answer: string;
    }>;
    const located = generalItems.find((i) =>
      /where are you located/i.test(i.question)
    );
    expect(located?.answer).toContain("1 High St");
    expect(located?.answer).toContain("Leeds");
  });
});
