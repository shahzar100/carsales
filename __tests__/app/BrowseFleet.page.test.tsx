/**
 * Tests for src/app/(main)/BrowseFleet/page.tsx
 *
 * Server component — parses URL filters, fetches matching cars (with
 * sort+skip+limit) + total + facets + total-available in parallel, then
 * hands everything to BrowseFleetContent (already tested).
 *
 * Standards coverage:
 * - 📋 Functional: search params parsed → mongoFilter + sort + pagination
 *   threaded through; facets union over all available cars (not the
 *   filtered set); badges in the ServiceHero use the live `totalAvailable`
 *   count; results passed to BrowseFleetContent are serialised
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockFind = jest.fn();
const mockCountDocuments = jest.fn();

jest.mock("@/lib/models", () => ({
  getCarsCollection: jest.fn(async () => ({
    find: (filter: unknown, opts?: unknown) => mockFind(filter, opts),
    countDocuments: (filter: unknown) => mockCountDocuments(filter),
  })),
  serializeDocument: (d: unknown) => ({ serialized: true, ...(d as object) }),
}));

// Stub the heavy children so we can inspect props.
let contentProps: any = null;
let heroProps: any = null;
jest.mock("@/app/(main)/BrowseFleet/BrowseFleetContent", () => ({
  __esModule: true,
  default: (props: unknown) => {
    contentProps = props;
    return <div data-testid="browse-content" />;
  },
}));
jest.mock("@/app/(main)/BrowseFleet/Loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-fallback" />,
}));
jest.mock("@/components/Services/Common", () => ({
  ServiceHero: (props: unknown) => {
    heroProps = props;
    return <div data-testid="service-hero" />;
  },
}));
jest.mock("@/components/SEO/Breadcrumb", () => ({
  Breadcrumb: (props: { items: unknown }) => (
    <nav data-testid="breadcrumb">{JSON.stringify(props.items)}</nav>
  ),
}));

import BrowseFleetPage from "@/app/(main)/BrowseFleet/page";

/**
 * Build a fake MongoDB cursor chain that supports the operators used
 * by the page: find(...).sort(...).skip(...).limit(...).toArray()
 * AND the .toArray() called directly on getFacets' projected find.
 */
function chain(rows: unknown[]) {
  const c: any = {};
  c.sort = jest.fn().mockReturnValue(c);
  c.skip = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockReturnValue(c);
  c.toArray = jest.fn().mockResolvedValue(rows);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  contentProps = null;
  heroProps = null;
});

describe("/BrowseFleet page", () => {
  it("📋 default (no params): page 1, perPage default, empty filter, facets union", async () => {
    // 1st find: main car query. 2nd find: facets projection.
    mockFind
      .mockReturnValueOnce(chain([{ _id: "c1", make: "Tesla" }]))
      .mockReturnValueOnce(
        chain([
          { make: "Tesla", colour: "White", doors: 4, features: ["AC"] },
          { make: "BMW", colour: "Black", doors: 4, features: ["AC", "Sunroof"] },
          { make: "Audi", colour: "White", doors: 2, features: [] },
        ])
      );
    mockCountDocuments
      .mockResolvedValueOnce(1) // total matching filter
      .mockResolvedValueOnce(3); // total available

    const ui = await BrowseFleetPage({
      searchParams: Promise.resolve({}),
    });
    render(ui);

    // Content was rendered with serialised cars + filter facets.
    expect(contentProps.cars).toEqual([
      { serialized: true, _id: "c1", make: "Tesla" },
    ]);
    expect(contentProps.facets.makes).toEqual(["Audi", "BMW", "Tesla"]);
    expect(contentProps.facets.colours).toEqual(["Black", "White"]);
    expect(contentProps.facets.doors).toEqual([2, 4]);
    expect(contentProps.facets.features).toEqual(["AC", "Sunroof"]);
    expect(contentProps.totalMatching).toBe(1);
    expect(contentProps.totalAvailable).toBe(3);
  });

  it("🎯 hero badge surfaces the live totalAvailable count", async () => {
    mockFind.mockReturnValueOnce(chain([])).mockReturnValueOnce(chain([]));
    mockCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(42);

    const ui = await BrowseFleetPage({ searchParams: Promise.resolve({}) });
    render(ui);

    const badges = heroProps.badges as Array<{ text: string }>;
    expect(badges.some((b) => /42 vehicles available/i.test(b.text))).toBe(
      true
    );
  });

  it("📋 facets are restricted to status='available' (not the filtered set)", async () => {
    mockFind.mockReturnValueOnce(chain([])).mockReturnValueOnce(chain([]));
    mockCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    await BrowseFleetPage({
      searchParams: Promise.resolve({ make: "Tesla" }),
    });

    // 2nd find call is for facets — filter MUST be { status: "available" }.
    const [filter, opts] = mockFind.mock.calls[1];
    expect(filter).toEqual({ status: "available" });
    expect(opts).toMatchObject({
      projection: { make: 1, colour: 1, doors: 1, features: 1 },
    });

    // 2nd count call is for totalAvailable — filter is also "available" only.
    expect(mockCountDocuments).toHaveBeenNthCalledWith(2, {
      status: "available",
    });
  });

  it("📋 pagination: page=2 → skip = perPage; sort + limit threaded into the cursor", async () => {
    const mainCursor = chain([]);
    mockFind.mockReturnValueOnce(mainCursor).mockReturnValueOnce(chain([]));
    mockCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    await BrowseFleetPage({
      searchParams: Promise.resolve({ page: "2" }),
    });

    expect(mainCursor.skip).toHaveBeenCalledTimes(1);
    expect(mainCursor.limit).toHaveBeenCalledTimes(1);
    const [skipArg] = mainCursor.skip.mock.calls[0];
    const [limitArg] = mainCursor.limit.mock.calls[0];
    // skip = (page-1) * perPage. perPage defaults to the parsed value.
    expect(skipArg).toBe(limitArg); // page 2 → skip one full page
  });

  it("📋 breadcrumb + SEO scaffolding always renders", async () => {
    mockFind.mockReturnValueOnce(chain([])).mockReturnValueOnce(chain([]));
    mockCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    const ui = await BrowseFleetPage({ searchParams: Promise.resolve({}) });
    render(ui);
    const crumb = screen.getByTestId("breadcrumb");
    expect(crumb.textContent).toContain("/BrowseFleet");
    expect(crumb.textContent).toContain('"name":"Home"');
    expect(screen.getByTestId("service-hero")).toBeInTheDocument();
    expect(screen.getByTestId("browse-content")).toBeInTheDocument();
  });
});
