/**
 * Tests for the dynamic detail-page shells:
 *   src/app/(main)/Booking/[_id]/page.tsx
 *   src/app/(main)/BrowseFleet/[_id]/page.tsx (page + generateMetadata)
 *
 * BrowseFleet/[_id] is the meatier one — it owns:
 * - the `getCar`/`getSimilarCars` DB calls (with try/catch + logError)
 * - the schema.org Vehicle JSON-LD payload (rich-result eligibility)
 * - the BreadcrumbList wrapper
 * - the "Vehicle Not Found" branch when findOne returns null
 * - generateMetadata's two branches (found / not-found)
 *
 * Standards coverage:
 * - 🔒 Security/SEO: not-found branch sets `robots: { index: false }` so
 *   we don't leak 404s into the index
 * - 📋 Functional: similar-cars fallback (matching fuel < 4 → fall back
 *   to any available)
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// ── Booking/[_id] mocks ──────────────────────────────────────
jest.mock("@/components/CarViewing", () => ({
  __esModule: true,
  default: () => <div data-testid="car-viewing" />,
}));

// ── BrowseFleet/[_id] mocks ──────────────────────────────────
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockLogError = jest.fn();

jest.mock("mongodb", () => ({
  ObjectId: jest.fn().mockImplementation(function (this: any, id: string) {
    this._id = id;
  }),
}));
jest.mock("@/lib/models", () => ({
  // The detail pages delegate single-car fetches to the shared getCarById
  // helper (find-one-by-id + serialize + swallow-via-logError). Mirror that
  // contract here so the existing mockFindOne/mockLogError setup still drives
  // behaviour after the models consolidation.
  getCarById: jest.fn(async (id: string, context = "getCarById") => {
    try {
      const car = await mockFindOne({ _id: id });
      return car ? { ...(car as object) } : null;
    } catch (error) {
      mockLogError(error, { context });
      return null;
    }
  }),
  getCarsCollection: jest.fn(async () => ({
    findOne: (q: unknown) => mockFindOne(q),
    find: (q: unknown) => mockFind(q),
  })),
  // businessInfo collections needed by generateMetadata via getBusinessInfo
  getBusinessInfoCollection: jest.fn(async () => ({
    findOne: jest.fn().mockResolvedValue({ businessName: "MMC Leeds" }),
  })),
  getDetailingPackagesCollection: jest.fn(async () => ({
    find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  })),
  getTintOptionsCollection: jest.fn(async () => ({
    find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  })),
  getServiceOverviewsCollection: jest.fn(async () => ({
    find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  })),
  getRecoveryInfoCollection: jest.fn(async () => ({
    findOne: jest.fn().mockResolvedValue(null),
  })),
  serializeDocument: (d: unknown) => ({ ...(d as object) }),
}));
jest.mock("@/lib/utils/observability", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

// notFound() halts rendering by throwing; mirror that so the page's
// `if (!car) notFound()` branch is observable as a thrown call.
const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

let carDetailProps: any = null;
jest.mock("@/components/Car/CarDetailView", () => ({
  __esModule: true,
  default: (props: unknown) => {
    carDetailProps = props;
    return <div data-testid="car-detail-view" />;
  },
}));
let jsonLdData: unknown = null;
jest.mock("@/components/SEO/JsonLd", () => ({
  JsonLd: ({ data }: { data: unknown }) => {
    jsonLdData = data;
    return <div data-testid="json-ld" />;
  },
}));
let breadcrumbItems: unknown = null;
jest.mock("@/components/SEO/Breadcrumb", () => ({
  Breadcrumb: ({ items }: { items: unknown }) => {
    breadcrumbItems = items;
    return <div data-testid="breadcrumb" />;
  },
}));

function chain(rows: unknown[]) {
  const c: any = {};
  c.limit = jest.fn().mockReturnValue(c);
  c.toArray = jest.fn().mockResolvedValue(rows);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  carDetailProps = null;
  jsonLdData = null;
  breadcrumbItems = null;
});

// ── Booking/[_id] ────────────────────────────────────────────
describe("(main)/Booking/[_id] page", () => {
  it("📋 server-fetches the car by [_id] and renders CarViewing", async () => {
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      price: 35000,
      mileage: 12000,
      fuel: "Electric",
      transmission: "Automatic",
      doors: 4,
      colour: "White",
      status: "available",
    });
    const Page = (await import("@/app/(main)/Booking/[_id]/page")).default;
    const ui = await Page({
      params: Promise.resolve({ _id: "507f1f77bcf86cd799439011" }),
    });
    render(ui);
    expect(screen.getByTestId("car-viewing")).toBeInTheDocument();
  });
});

// ── BrowseFleet/[_id] ────────────────────────────────────────
const carDoc = {
  _id: "507f1f77bcf86cd799439011",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  price: 35000,
  mileage: 12000,
  fuel: "Electric",
  transmission: "Automatic",
  doors: 4,
  colour: "White",
  status: "available",
  description: "Pristine, one owner",
  image: "/main.webp",
};

describe("(main)/BrowseFleet/[_id] page", () => {
  it("🔒 findOne returns null → notFound() (real 404, not a soft 200)", async () => {
    mockFindOne.mockResolvedValue(null);
    const Page = (await import("@/app/(main)/BrowseFleet/[_id]/page"))
      .default;
    await expect(
      Page({ params: Promise.resolve({ _id: "missing-id" }) })
    ).rejects.toThrow();
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("🔒 getCar swallows DB errors via logError → notFound()", async () => {
    mockFindOne.mockRejectedValueOnce(new Error("db down"));
    const Page = (await import("@/app/(main)/BrowseFleet/[_id]/page"))
      .default;
    await expect(
      Page({ params: Promise.resolve({ _id: carDoc._id }) })
    ).rejects.toThrow();
    expect(mockNotFound).toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: "BrowseFleet/[_id]" })
    );
  });

  it("📋 found car → JsonLd, Breadcrumb, and CarDetailView all wired up", async () => {
    mockFindOne.mockResolvedValue(carDoc);
    // 4 similar matching fuel → no fallback needed.
    const similar = [
      { _id: "s1", make: "BMW", model: "i3" },
      { _id: "s2", make: "Nissan", model: "Leaf" },
      { _id: "s3", make: "Hyundai", model: "Kona" },
      { _id: "s4", make: "Polestar", model: "2" },
    ];
    mockFind.mockReturnValueOnce(chain(similar));

    const Page = (await import("@/app/(main)/BrowseFleet/[_id]/page"))
      .default;
    const ui = await Page({
      params: Promise.resolve({ _id: carDoc._id }),
    });
    render(ui);

    expect(screen.getByTestId("car-detail-view")).toBeInTheDocument();
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();

    // Card payload threads through.
    expect(carDetailProps.car.make).toBe("Tesla");
    expect(carDetailProps.similar).toHaveLength(4);

    // Schema.org Vehicle shape — spot-check key fields.
    expect(jsonLdData).toMatchObject({
      "@type": "Vehicle",
      name: "2023 Tesla Model 3",
      manufacturer: { name: "Tesla" },
      vehicleTransmission: "Automatic",
      fuelType: "Electric",
      offers: expect.objectContaining({
        price: 35000,
        availability: "https://schema.org/InStock",
        seller: expect.objectContaining({ "@type": "AutoDealer" }),
      }),
    });
    // BreadcrumbList items.
    expect(breadcrumbItems).toEqual([
      { name: "Home", url: "/" },
      { name: "Browse Fleet", url: "/BrowseFleet" },
      {
        name: "2023 Tesla Model 3",
        url: `/BrowseFleet/${carDoc._id}`,
      },
    ]);
  });

  it("📋 similar-cars fallback fires when fuel match returns < 4", async () => {
    mockFindOne.mockResolvedValue(carDoc);
    const fuelMatch = [{ _id: "s1", make: "BMW", model: "i3" }];
    const fallback = [
      { _id: "f1" },
      { _id: "f2" },
      { _id: "f3" },
      { _id: "f4" },
    ];
    mockFind
      .mockReturnValueOnce(chain(fuelMatch)) // fuel query
      .mockReturnValueOnce(chain(fallback)); // fallback

    const Page = (await import("@/app/(main)/BrowseFleet/[_id]/page"))
      .default;
    const ui = await Page({
      params: Promise.resolve({ _id: carDoc._id }),
    });
    render(ui);

    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(carDetailProps.similar).toHaveLength(4);
    expect(carDetailProps.similar[0]).toEqual({ _id: "f1" });
  });

  it("🔒 reserved status → schema offer availability is PreOrder", async () => {
    mockFindOne.mockResolvedValue({ ...carDoc, status: "reserved" });
    mockFind.mockReturnValue(chain([]));
    const Page = (await import("@/app/(main)/BrowseFleet/[_id]/page"))
      .default;
    const ui = await Page({ params: Promise.resolve({ _id: carDoc._id }) });
    render(ui);
    expect((jsonLdData as any).offers.availability).toBe(
      "https://schema.org/PreOrder"
    );
  });

  it("🔒 sold status → schema offer availability is OutOfStock", async () => {
    mockFindOne.mockResolvedValue({ ...carDoc, status: "sold" });
    mockFind.mockReturnValue(chain([]));
    const Page = (await import("@/app/(main)/BrowseFleet/[_id]/page"))
      .default;
    const ui = await Page({ params: Promise.resolve({ _id: carDoc._id }) });
    render(ui);
    expect((jsonLdData as any).offers.availability).toBe(
      "https://schema.org/OutOfStock"
    );
  });
});

describe("(main)/BrowseFleet/[_id] generateMetadata", () => {
  it("🔒 missing car → robots: { index: false } so 404s don't get indexed", async () => {
    mockFindOne.mockResolvedValue(null);
    const { generateMetadata } = await import(
      "@/app/(main)/BrowseFleet/[_id]/page"
    );
    const meta = await generateMetadata({
      params: Promise.resolve({ _id: "missing" }),
    });
    expect(meta.title).toMatch(/not found/i);
    expect(meta.robots).toEqual({ index: false });
  });

  it("📋 found car → title is year/make/model + canonical alternates set", async () => {
    mockFindOne.mockResolvedValue(carDoc);
    const { generateMetadata } = await import(
      "@/app/(main)/BrowseFleet/[_id]/page"
    );
    const meta = await generateMetadata({
      params: Promise.resolve({ _id: carDoc._id }),
    });
    expect(meta.title).toBe("2023 Tesla Model 3");
    expect(meta.alternates).toEqual({
      canonical: `/BrowseFleet/${carDoc._id}`,
    });
    // OG image threads through from car.image.
    expect((meta.openGraph as any).images[0]).toEqual({
      url: "/main.webp",
      alt: "2023 Tesla Model 3",
    });
  });

  it("🎯 found car without image → falls back to /car.jpg OG image", async () => {
    mockFindOne.mockResolvedValue({ ...carDoc, image: "" });
    const { generateMetadata } = await import(
      "@/app/(main)/BrowseFleet/[_id]/page"
    );
    const meta = await generateMetadata({
      params: Promise.resolve({ _id: carDoc._id }),
    });
    expect((meta.openGraph as any).images[0].url).toBe("/car.jpg");
  });
});
