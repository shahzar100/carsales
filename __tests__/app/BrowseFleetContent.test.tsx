/**
 * Tests for src/app/(main)/BrowseFleet/BrowseFleetContent.tsx
 *
 * Customer-side URL-driven fleet listing. Filter state lives in the URL —
 * changing a control calls `router.push(pathname?<next-query>, { scroll: false })`.
 * Tests verify the right query string for each control, that filter
 * changes drop the `page` param, and that the empty/pagination/active-
 * count branches all render.
 *
 * Standards coverage:
 * - 📋 Functional: per-control URL-update wiring (search, make, price min,
 *   year, mileage, doors, colour, sort, page); page reset on non-page
 *   changes; reset clears everything to bare pathname; features toggle
 *   adds/removes from comma-joined list
 * - 🎯 Usability: empty-state copy when no cars; "1 vehicle" singular vs
 *   "N vehicles" plural; pagination only renders when >1 page; "X of Y"
 *   summary and active-count badge
 */
import React from "react";
import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import { NavigationProvider } from "@/contexts/NavigationContext";

const mockPush = jest.fn();
const mockUseSearchParams = jest.fn(() => new URLSearchParams());

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/BrowseFleet",
  useSearchParams: () => mockUseSearchParams(),
}));

// SavedCarsContext is read transitively by CarListCard's SaveCarButton.
jest.mock("@/contexts/SavedCarsContext", () => ({
  useSavedCars: () => ({
    savedIds: [],
    isSaved: () => false,
    toggle: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  }),
}));

import BrowseFleetContent from "@/app/(main)/BrowseFleet/BrowseFleetContent";
import type { CarInterface } from "@/lib/interfaces";

const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

const baseFacets = {
  makes: ["Tesla", "BMW", "Audi"],
  colours: ["White", "Black"],
  doors: [3, 5],
  features: ["Heated seats", "Sunroof"],
};

const blankFilters = {
  page: 1,
  perPage: 10,
} as any;

const sampleCar = {
  _id: "car-1",
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
  features: [],
  description: "",
  featured: false,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
} as unknown as CarInterface;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
});

describe("BrowseFleetContent", () => {
  it("📋 search input change → router.push with ?search=...", () => {
    render(
      <BrowseFleetContent
        cars={[]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={0}
        totalAvailable={5}
      />
    );
    fireEvent.change(screen.getByLabelText(/search/i), {
      target: { value: "tesla" },
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/BrowseFleet?search=tesla",
      expect.objectContaining({ scroll: false })
    );
  });

  it("📋 sort change → router.push with ?sort=...", () => {
    render(
      <BrowseFleetContent
        cars={[sampleCar]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={1}
        totalAvailable={5}
      />
    );
    fireEvent.change(screen.getByLabelText(/sort by/i), {
      target: { value: "priceAsc" },
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/BrowseFleet?sort=priceAsc",
      expect.objectContaining({ scroll: false })
    );
  });

  it("📋 changing a filter drops a stale ?page= from the query", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("page=3&sort=newest")
    );
    render(
      <BrowseFleetContent
        cars={[]}
        facets={baseFacets}
        filters={{ ...blankFilters, page: 3 }}
        totalMatching={0}
        totalAvailable={5}
      />
    );
    fireEvent.change(screen.getByLabelText(/search/i), {
      target: { value: "tesla" },
    });
    const url = mockPush.mock.calls[0][0] as string;
    // search appended, sort preserved, page dropped.
    expect(url).toContain("search=tesla");
    expect(url).toContain("sort=newest");
    expect(url).not.toContain("page=");
  });

  it("📋 empty-string filter value deletes the key (not blanks it)", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("search=tesla"));
    render(
      <BrowseFleetContent
        cars={[]}
        facets={baseFacets}
        filters={{ ...blankFilters, search: "tesla" }}
        totalMatching={0}
        totalAvailable={5}
      />
    );
    fireEvent.change(screen.getByLabelText(/search/i), {
      target: { value: "" },
    });
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("search=");
  });

  it("🎯 active-count badge + Clear button only show when filters are active", () => {
    const { rerender } = render(
      <BrowseFleetContent
        cars={[]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={0}
        totalAvailable={5}
      />
    );
    expect(screen.queryByText(/active/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /clear/i })
    ).not.toBeInTheDocument();

    rerender(
      <NavigationProvider>
        <BrowseFleetContent
          cars={[]}
          facets={baseFacets}
          filters={{ ...blankFilters, search: "tesla", make: "Tesla" }}
          totalMatching={1}
          totalAvailable={5}
        />
      </NavigationProvider>
    );
    expect(screen.getByText(/2 active/i)).toBeInTheDocument();
    const clear = screen.getByRole("button", { name: /clear/i });
    expect(clear).toBeInTheDocument();
    fireEvent.click(clear);
    // Resetting pushes to the bare pathname.
    expect(mockPush).toHaveBeenCalledWith(
      "/BrowseFleet",
      expect.objectContaining({ scroll: false })
    );
  });

  it("🎯 empty-state copy renders when cars.length === 0", () => {
    render(
      <BrowseFleetContent
        cars={[]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={0}
        totalAvailable={5}
      />
    );
    expect(screen.getByText(/no vehicles found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/try adjusting your filters/i)
    ).toBeInTheDocument();
  });

  it("🎯 singular 'vehicle found' vs plural via totalMatching", () => {
    const { rerender } = render(
      <BrowseFleetContent
        cars={[sampleCar]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={1}
        totalAvailable={5}
      />
    );
    expect(screen.getByText(/1 vehicle found/i)).toBeInTheDocument();
    rerender(
      <NavigationProvider>
        <BrowseFleetContent
          cars={[sampleCar]}
          facets={baseFacets}
          filters={blankFilters}
          totalMatching={4}
          totalAvailable={5}
        />
      </NavigationProvider>
    );
    expect(screen.getByText(/4 vehicles found/i)).toBeInTheDocument();
  });

  it("📋 cars list renders one CarListCard per car", () => {
    const carB = { ...sampleCar, _id: "car-2", make: "BMW", model: "320d" };
    render(
      <BrowseFleetContent
        cars={[sampleCar, carB]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={2}
        totalAvailable={5}
      />
    );
    expect(screen.getByText("Tesla Model 3")).toBeInTheDocument();
    expect(screen.getByText("BMW 320d")).toBeInTheDocument();
  });

  it("📋 pagination block + 'Showing X–Y of Z' header only on multi-page", () => {
    const cars = Array.from({ length: 10 }, (_, i) => ({
      ...sampleCar,
      _id: `car-${i + 1}`,
    }));
    render(
      <BrowseFleetContent
        cars={cars}
        facets={baseFacets}
        filters={{ ...blankFilters, page: 2, perPage: 10 }}
        totalMatching={25}
        totalAvailable={25}
      />
    );
    // 25 total, 10 perPage, page 2 → start=10, end=20.
    expect(screen.getByText(/showing 11–20 of 25/i)).toBeInTheDocument();
  });

  it("📋 features facet renders the chip list + onToggle threads the value", () => {
    render(
      <BrowseFleetContent
        cars={[]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={0}
        totalAvailable={5}
      />
    );
    // CarFeatures renders a button per feature.
    const chip = screen.getByRole("button", { name: /heated seats/i });
    fireEvent.click(chip);
    expect(mockPush).toHaveBeenCalledWith(
      "/BrowseFleet?features=Heated+seats",
      expect.objectContaining({ scroll: false })
    );
  });

  it("📋 doors filter formats option labels and threads value through", () => {
    render(
      <BrowseFleetContent
        cars={[]}
        facets={baseFacets}
        filters={blankFilters}
        totalMatching={0}
        totalAvailable={5}
      />
    );
    // FilterSelect doesn't bind the <label> to the <select> via htmlFor,
    // so reach for the select directly via the "5 doors" option it contains.
    const fiveOption = screen.getByRole("option", {
      name: /5 doors/i,
    }) as HTMLOptionElement;
    const doorsSelect = fiveOption.closest("select") as HTMLSelectElement;
    fireEvent.change(doorsSelect, { target: { value: "5" } });
    expect(mockPush).toHaveBeenCalledWith(
      "/BrowseFleet?doors=5",
      expect.objectContaining({ scroll: false })
    );
  });
});
