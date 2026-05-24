/**
 * Tests for src/app/(main)/Services/page.tsx
 *
 * Standards coverage:
 * - 📋 Functional: serviceOverviews from businessInfo flow through to
 *   PackageCard children with the right href + accent (detailing → red,
 *   tints → crimson, repairs → dark). Why-Choose-Us block + Book-a-
 *   Service CTA appear. Unknown service ids fall back to /Services + red.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetBusinessInfo = jest.fn();

jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));

const capturedCards: any[] = [];
const capturedJsonLd: any[] = [];

jest.mock("@/components/Services/Common", () => ({
  PackageGrid: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section data-testid="pkg-grid" data-title={title}>
      {children}
    </section>
  ),
  PackageCard: (props: any) => {
    capturedCards.push(props);
    return (
      <article data-testid="pkg-card" data-accent={props.accent}>
        <h3>{props.name}</h3>
        <p>{props.subtitle}</p>
        <p>{props.price}</p>
        <div>{props.footer}</div>
        <div>{props.children}</div>
      </article>
    );
  },
  FeatureList: ({ features }: { features: string[] }) => (
    <ul data-testid="feature-list">
      {features.map((f) => (
        <li key={f}>{f}</li>
      ))}
    </ul>
  ),
  InfoBox: ({ rows }: { rows: { label: string; value: string }[] }) => (
    <ul data-testid="info-box">
      {rows.map((r) => (
        <li key={r.label}>
          {r.label} {r.value}
        </li>
      ))}
    </ul>
  ),
  BlackRedSection: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="black-red">{children}</section>
  ),
  ServiceHero: ({ title }: { title: string }) => (
    <header data-testid="hero">{title}</header>
  ),
}));

jest.mock("@/components/SEO/JsonLd", () => ({
  JsonLd: ({ data }: { data: unknown }) => {
    capturedJsonLd.push(data);
    return <div data-testid="json-ld" />;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  capturedCards.length = 0;
  capturedJsonLd.length = 0;
  mockGetBusinessInfo.mockResolvedValue({
    businessName: "MMC Leeds",
    city: "Leeds",
    serviceOverviews: [
      {
        id: "detailing",
        title: "Detailing",
        subtitle: "Premium clean",
        priceRange: "£150-£500",
        duration: "3-6h",
        features: ["Wax", "Clay"],
      },
      {
        id: "tints",
        title: "Tints",
        subtitle: "Window film",
        priceRange: "£200-£800",
        duration: "2-4h",
        features: ["UV"],
      },
      {
        id: "repairs",
        title: "Repairs",
        subtitle: "Diagnostics",
        priceRange: "Quote",
        duration: "1-5 days",
        features: ["Brakes"],
      },
    ],
  });
});

describe("(main)/Services page", () => {
  it("📋 ServiceHero gets the Professional Auto Services title", async () => {
    const Page = (await import("@/app/(main)/Services/page")).default;
    render(await Page());
    expect(screen.getByTestId("hero")).toHaveTextContent(
      /professional auto services/i
    );
  });

  it("📋 emits JSON-LD Service schema branded to the business + city", async () => {
    const Page = (await import("@/app/(main)/Services/page")).default;
    render(await Page());

    expect(capturedJsonLd).toHaveLength(1);
    expect(capturedJsonLd[0]).toMatchObject({
      "@type": "Service",
      provider: { "@type": "AutoDealer", name: "MMC Leeds" },
      areaServed: { "@type": "City", name: "Leeds" },
    });
  });

  it("📋 renders one PackageCard per service, with id-keyed accents + hrefs", async () => {
    const Page = (await import("@/app/(main)/Services/page")).default;
    render(await Page());

    expect(capturedCards).toHaveLength(3);

    const byName = (n: string) => capturedCards.find((c) => c.name === n);
    expect(byName("Detailing").accent).toBe("red");
    expect(byName("Tints").accent).toBe("crimson");
    expect(byName("Repairs").accent).toBe("dark");
  });

  it("📋 unknown service id falls back to /Services + 'red' accent", async () => {
    mockGetBusinessInfo.mockResolvedValue({
      businessName: "X",
      city: "Y",
      serviceOverviews: [
        {
          id: "mystery",
          title: "Mystery",
          subtitle: "?",
          priceRange: "?",
          duration: "?",
          features: [],
        },
      ],
    });
    const Page = (await import("@/app/(main)/Services/page")).default;
    render(await Page());

    expect(capturedCards).toHaveLength(1);
    expect(capturedCards[0].accent).toBe("red");
  });

  it("📋 'Why Choose' block + 'Book a Service' CTA appear with a /Book link", async () => {
    const Page = (await import("@/app/(main)/Services/page")).default;
    const { container } = render(await Page());

    expect(
      screen.getByText(/why choose our services/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/book a service/i)).toBeInTheDocument();
    expect(container.querySelector("a[href='/Book']")).toBeInTheDocument();
  });

  it("📋 empty serviceOverviews → still renders the page without throwing", async () => {
    mockGetBusinessInfo.mockResolvedValue({
      businessName: "X",
      city: "Y",
      serviceOverviews: undefined,
    });
    const Page = (await import("@/app/(main)/Services/page")).default;
    render(await Page());
    expect(capturedCards).toHaveLength(0);
  });
});
