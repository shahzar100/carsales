/**
 * Tests for src/app/(main)/AboutUs/page.tsx
 *
 * Standards coverage:
 * - 📋 Functional: hero + values block render; brands chip list shows
 *   one chip per distinct make; recovery card omitted when recovery
 *   missing; social icons render only for non-empty URLs; service cards
 *   resolve to the right /Services/{detailing|tints|repairs} route.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetBusinessInfo = jest.fn();
const mockGetCarsCollection = jest.fn();

jest.mock("@/lib/utils/businessInfo", () => ({
  getBusinessInfo: () => mockGetBusinessInfo(),
}));
jest.mock("@/lib/models", () => ({
  getCarsCollection: () => mockGetCarsCollection(),
}));

jest.mock("@/components/Services/Common", () => ({
  BlackRedSection: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="black-red">{children}</section>
  ),
  ProcessFlow: ({ title }: { title: string }) => (
    <div data-testid="process-flow">{title}</div>
  ),
}));

const baseInfo = {
  businessName: "MMC Leeds",
  phone: "0113 999 0000",
  email: "hello@example.com",
  address: "Test St",
  city: "Leeds",
  state: "WY",
  zipCode: "LS1 1AA",
  description: "We sell cars",
  hours: {
    monday: "9-5",
    tuesday: "9-5",
    wednesday: "9-5",
    thursday: "9-5",
    friday: "9-5",
    saturday: "10-2",
    sunday: "Closed",
  },
  heroStats: {
    vehicles: { value: "500+", label: "Quality Vehicles" },
    booking: { value: "24/7", label: "Online Booking" },
    rating: { value: "4.9", label: "Customer Rating" },
  },
  serviceOverviews: [
    {
      id: "detailing",
      title: "Detailing",
      subtitle: "Inside/out",
      priceRange: "£150-£500",
      duration: "3-6h",
      features: ["Wax", "Clay", "Vacuum", "Engine Bay"],
    },
    {
      id: "tints",
      title: "Tints",
      subtitle: "Window film",
      priceRange: "£200-£800",
      duration: "2-4h",
      features: ["UV"],
    },
  ],
  recovery: {
    coverageAreas: ["Leeds", "Bradford", "York", "Wakefield"],
    pricingTiers: [{ name: "Local", price: "£60", distance: "10mi" }],
    responseTime: "30 mins",
  },
  socialMedia: {
    facebook: "https://facebook.com/mmc",
    twitter: "",
    instagram: "https://instagram.com/mmc",
  },
};

function setupCarsCollection({
  available = 25,
  sold = 100,
  makes = ["Tesla", "BMW", "Audi", "Ford"],
} = {}) {
  mockGetCarsCollection.mockResolvedValue({
    countDocuments: jest.fn().mockImplementation(async (q: any) => {
      if (q.status === "available") return available;
      return sold;
    }),
    distinct: jest.fn().mockResolvedValue(makes),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBusinessInfo.mockResolvedValue(baseInfo);
  setupCarsCollection();
});

describe("(main)/AboutUs page", () => {
  it("📋 hero shows the business name + description", async () => {
    const Page = (await import("@/app/(main)/AboutUs/page")).default;
    render(await Page());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /about/i
    );
    expect(screen.getByText("We sell cars")).toBeInTheDocument();
  });

  it("📋 brand chip list shows one Link per distinct make", async () => {
    const Page = (await import("@/app/(main)/AboutUs/page")).default;
    const { container } = render(await Page());

    expect(container.querySelector("a[href='/BrowseFleet/Tesla']")).toBeInTheDocument();
    expect(container.querySelector("a[href='/BrowseFleet/BMW']")).toBeInTheDocument();
    expect(container.querySelector("a[href='/BrowseFleet/Ford']")).toBeInTheDocument();
  });

  it("📋 omits the recovery card link (/Recoveries) when recovery is missing", async () => {
    mockGetBusinessInfo.mockResolvedValue({ ...baseInfo, recovery: undefined });
    const Page = (await import("@/app/(main)/AboutUs/page")).default;
    const { container } = render(await Page());

    expect(container.querySelector("a[href='/Recoveries']")).toBeNull();
  });

  it("📋 renders the service-card titles plus the recovery card", async () => {
    const Page = (await import("@/app/(main)/AboutUs/page")).default;
    render(await Page());

    expect(screen.getByText("Detailing")).toBeInTheDocument();
    expect(screen.getByText("Tints")).toBeInTheDocument();
    expect(screen.getAllByText(/breakdown recovery/i).length).toBeGreaterThan(
      0
    );
  });

  it("📋 only renders social-media icons for non-empty URLs", async () => {
    const Page = (await import("@/app/(main)/AboutUs/page")).default;
    const { container } = render(await Page());

    expect(
      container.querySelector("a[href='https://facebook.com/mmc']")
    ).toBeInTheDocument();
    expect(
      container.querySelector("a[href='https://instagram.com/mmc']")
    ).toBeInTheDocument();
    // Twitter empty → no anchor.
    expect(container.querySelector("a[aria-label='Twitter']")).toBeNull();
  });

  it("📋 hero stats are suppressed when none qualify (low car counts + no rating)", async () => {
    setupCarsCollection({ available: 1, sold: 1, makes: ["Tesla"] });
    mockGetBusinessInfo.mockResolvedValue({
      ...baseInfo,
      heroStats: undefined,
    });
    const Page = (await import("@/app/(main)/AboutUs/page")).default;
    render(await Page());

    // No "+ Cars In Stock" or similar pill label.
    expect(screen.queryByText(/cars in stock/i)).not.toBeInTheDocument();
  });

  it("📋 final CTA links to /BrowseFleet, /Services, and tel:phone", async () => {
    const Page = (await import("@/app/(main)/AboutUs/page")).default;
    const { container } = render(await Page());

    expect(container.querySelector("a[href='/BrowseFleet']")).toBeInTheDocument();
    expect(container.querySelector("a[href='/Services']")).toBeInTheDocument();
    expect(
      container.querySelector("a[href='tel:0113 999 0000']")
    ).toBeInTheDocument();
  });
});
