/**
 * CARPARTSGRID COMPONENT TESTS (TDD — written before implementation)
 *
 * Tests the updated CarPartsGrid component that:
 * - Accepts CarPartInterface[] from @/lib/interfaces (not local CarPart type)
 * - Displays car part cards with name, brand, price, condition badge, compatibility, stock status
 * - Filters by search text, brand, category, condition
 * - Shows "Reserve Part" button that navigates to /Enquiry with query params
 * - Shows empty state when no parts match filters
 *
 * Standards coverage:
 * - 📋 Functional: Rendering, filtering, navigation
 * - 🎯 Usability: Empty states, condition badges, stock indicators
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarPartsGrid from "@/components/CarParts/CarPartsGrid";
import { CarPartInterface } from "@/lib/interfaces";

// ── Mocks ────────────────────────────────────────────────────

// Mock next/image — render plain <img>
jest.mock("next/image", () => {
  return function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// Mock Button component
jest.mock("@/components/Helpful/Buttons/Button", () => {
  return function MockButton({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

// Mock FilterSection — render simple filter controls for testing
jest.mock("@/components/CarParts/FilterSection", () => {
  return function MockFilterSection(props: {
    brands?: string[];
    categories?: string[];
    conditionFilters?: string[];
    selectedBrand: string;
    selectedCategory: string;
    selectedCondition: string;
    onBrandChange: (v: string) => void;
    onCategoryChange: (v: string) => void;
    onConditionChange: (v: string) => void;
  }) {
    return (
      <div data-testid="filter-section">
        <select
          data-testid="brand-filter"
          value={props.selectedBrand}
          onChange={(e) => props.onBrandChange(e.target.value)}
        >
          <option value="">All Brands</option>
          {(props.brands ?? []).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          data-testid="category-filter"
          value={props.selectedCategory}
          onChange={(e) => props.onCategoryChange(e.target.value)}
        >
          <option value="">All Categories</option>
          {(props.categories ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          data-testid="condition-filter"
          value={props.selectedCondition}
          onChange={(e) => props.onConditionChange(e.target.value)}
        >
          <option value="">All Conditions</option>
          {(props.conditionFilters ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    );
  };
});

// Mock next/navigation — capture router.push calls
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/CarParts";
  },
}));

// Mock scrollIntoView (not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

// ── Test Data ────────────────────────────────────────────────

const createMockPart = (
  overrides: Partial<CarPartInterface> = {}
): CarPartInterface => ({
  _id: "part-1",
  name: "BMW M3 Brake Pads",
  brand: "BMW",
  category: "Brakes",
  price: 149.99,
  image: "/images/brake-pads.jpg",
  condition: "New",
  compatibility: "BMW M3 2019-2023",
  description: "High-performance brake pads for BMW M3",
  inStock: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  ...overrides,
});

const mockParts: CarPartInterface[] = [
  createMockPart({
    _id: "part-1",
    name: "BMW M3 Brake Pads",
    brand: "BMW",
    category: "Brakes",
    price: 149.99,
    condition: "New",
    compatibility: "BMW M3 2019-2023",
    description: "High-performance brake pads",
    inStock: true,
  }),
  createMockPart({
    _id: "part-2",
    name: "Honda Civic Air Filter",
    brand: "Honda",
    category: "Engine",
    price: 29.99,
    condition: "New",
    compatibility: "Honda Civic 2020-2024",
    description: "OEM replacement air filter",
    inStock: true,
  }),
  createMockPart({
    _id: "part-3",
    name: "Toyota Camry Headlight Assembly",
    brand: "Toyota",
    category: "Lighting",
    price: 89.99,
    condition: "Refurbished",
    compatibility: "Toyota Camry 2018-2022",
    description: "Refurbished OEM headlight assembly",
    inStock: false,
  }),
  createMockPart({
    _id: "part-4",
    name: "Audi A4 Exhaust Manifold",
    brand: "Audi",
    category: "Exhaust",
    price: 349.99,
    condition: "Used",
    compatibility: "Audi A4 2017-2021",
    description: "Used exhaust manifold in good condition",
    inStock: true,
  }),
];

// ── Tests ────────────────────────────────────────────────────

describe("CarPartsGrid Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Rendering", () => {
    it("renders grid of car parts with correct data (name, brand, price displayed)", () => {
      render(<CarPartsGrid parts={mockParts} />);

      // Each part's name should be rendered
      expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      expect(screen.getByText("Honda Civic Air Filter")).toBeInTheDocument();
      expect(
        screen.getByText("Toyota Camry Headlight Assembly")
      ).toBeInTheDocument();
      expect(screen.getByText("Audi A4 Exhaust Manifold")).toBeInTheDocument();

      // Prices should be displayed
      expect(screen.getByText("£149.99")).toBeInTheDocument();
      expect(screen.getByText("£29.99")).toBeInTheDocument();
      expect(screen.getByText("£89.99")).toBeInTheDocument();
      expect(screen.getByText("£349.99")).toBeInTheDocument();
    });

    it("displays brand and category for each part", () => {
      render(<CarPartsGrid parts={mockParts} />);

      // Brand • Category pattern
      expect(screen.getByText(/BMW.*Brakes/)).toBeInTheDocument();
      expect(screen.getByText(/Honda.*Engine/)).toBeInTheDocument();
      expect(screen.getByText(/Toyota.*Lighting/)).toBeInTheDocument();
      expect(screen.getByText(/Audi.*Exhaust/)).toBeInTheDocument();
    });

    it("displays compatibility info for each part", () => {
      render(<CarPartsGrid parts={mockParts} />);

      expect(screen.getByText("BMW M3 2019-2023")).toBeInTheDocument();
      expect(screen.getByText("Honda Civic 2020-2024")).toBeInTheDocument();
      expect(screen.getByText("Toyota Camry 2018-2022")).toBeInTheDocument();
      expect(screen.getByText("Audi A4 2017-2021")).toBeInTheDocument();
    });

    it("displays condition badge for each part", () => {
      render(<CarPartsGrid parts={mockParts} />);

      // Should show condition text as badges (also present in filter dropdown options)
      const newBadges = screen.getAllByText("New");
      expect(newBadges.length).toBeGreaterThanOrEqual(2); // Two "New" parts

      const refurbishedElements = screen.getAllByText("Refurbished");
      expect(refurbishedElements.length).toBeGreaterThanOrEqual(1);
      const usedElements = screen.getAllByText("Used");
      expect(usedElements.length).toBeGreaterThanOrEqual(1);
    });

    it("displays stock status for each part", () => {
      render(<CarPartsGrid parts={mockParts} />);

      // Part 3 is out of stock — the others are in stock
      // The component should show some kind of stock indicator
      const inStockIndicators = screen.getAllByText(/In Stock/i);
      expect(inStockIndicators.length).toBeGreaterThanOrEqual(3);

      expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    });

    it("renders the filter section", () => {
      render(<CarPartsGrid parts={mockParts} />);

      expect(screen.getByTestId("filter-section")).toBeInTheDocument();
    });

    it("passes derived brand/category/condition arrays to FilterSection", () => {
      render(<CarPartsGrid parts={mockParts} />);

      const filterSection = screen.getByTestId("filter-section");

      // Brands dropdown should contain all unique brands
      const brandFilter = within(filterSection).getByTestId("brand-filter");
      expect(brandFilter).toBeInTheDocument();

      // Should have an option for each unique brand
      const brandOptions = within(brandFilter).getAllByRole("option");
      // "All Brands" + 4 unique brands
      expect(brandOptions.length).toBe(5);
    });
  });

  // ── Filtering ──────────────────────────────────────────────
  describe("Filtering", () => {
    it("filters by brand when brand filter is changed", async () => {
      render(<CarPartsGrid parts={mockParts} />);

      const brandFilter = screen.getByTestId("brand-filter");
      fireEvent.change(brandFilter, { target: { value: "BMW" } });

      // Only BMW part should be visible
      expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      expect(
        screen.queryByText("Honda Civic Air Filter")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Toyota Camry Headlight Assembly")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Audi A4 Exhaust Manifold")
      ).not.toBeInTheDocument();
    });

    it("filters by category when category filter is changed", () => {
      render(<CarPartsGrid parts={mockParts} />);

      const categoryFilter = screen.getByTestId("category-filter");
      fireEvent.change(categoryFilter, { target: { value: "Engine" } });

      expect(screen.getByText("Honda Civic Air Filter")).toBeInTheDocument();
      expect(screen.queryByText("BMW M3 Brake Pads")).not.toBeInTheDocument();
    });

    it("filters by condition when condition filter is changed", () => {
      render(<CarPartsGrid parts={mockParts} />);

      const conditionFilter = screen.getByTestId("condition-filter");
      fireEvent.change(conditionFilter, { target: { value: "Refurbished" } });

      expect(
        screen.getByText("Toyota Camry Headlight Assembly")
      ).toBeInTheDocument();
      expect(screen.queryByText("BMW M3 Brake Pads")).not.toBeInTheDocument();
    });

    it("shows empty state when no parts match filters", () => {
      render(<CarPartsGrid parts={mockParts} />);

      // Set brand to BMW and category to Engine — no parts match
      const brandFilter = screen.getByTestId("brand-filter");
      const categoryFilter = screen.getByTestId("category-filter");

      fireEvent.change(brandFilter, { target: { value: "BMW" } });
      fireEvent.change(categoryFilter, { target: { value: "Engine" } });

      // Should show "No parts found" message
      expect(screen.getByText(/No parts found/i)).toBeInTheDocument();
    });

    it("resets filter to show all parts when filter is cleared", () => {
      render(<CarPartsGrid parts={mockParts} />);

      const brandFilter = screen.getByTestId("brand-filter");

      // Filter to BMW only
      fireEvent.change(brandFilter, { target: { value: "BMW" } });
      expect(
        screen.queryByText("Honda Civic Air Filter")
      ).not.toBeInTheDocument();

      // Clear filter
      fireEvent.change(brandFilter, { target: { value: "" } });
      expect(screen.getByText("Honda Civic Air Filter")).toBeInTheDocument();
      expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
    });
  });

  // ── Reserve Part Navigation ────────────────────────────────
  describe("Reserve Part Navigation", () => {
    it("shows 'Reserve Part' button for each part", () => {
      render(<CarPartsGrid parts={mockParts} />);

      const reserveButtons = screen.getAllByText("Reserve Part");
      expect(reserveButtons.length).toBe(mockParts.length);
    });

    it("navigates to /contact with query params when Reserve Part is clicked", async () => {
      const user = userEvent.setup();
      render(<CarPartsGrid parts={mockParts} />);

      const reserveButtons = screen.getAllByText("Reserve Part");
      await user.click(reserveButtons[0]);

      // /Enquiry was consolidated into /contact in Day 3; the URL contract
      // (subject + part identification via query params) is unchanged.
      expect(mockPush).toHaveBeenCalledTimes(1);
      const calledUrl = mockPush.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/contact");
      expect(calledUrl).toContain("BMW+M3+Brake+Pads");
    });

    it("includes part name and brand in contact URL query params", async () => {
      const user = userEvent.setup();
      render(<CarPartsGrid parts={mockParts} />);

      const reserveButtons = screen.getAllByText("Reserve Part");
      await user.click(reserveButtons[1]); // Click Honda part's reserve button

      const calledUrl = mockPush.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/contact");
      // Should contain subject or part/brand params
      expect(calledUrl).toMatch(/part=|subject=/i);
      expect(calledUrl).toContain("Honda");
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────
  describe("Edge Cases", () => {
    it("renders empty state when parts array is empty", () => {
      render(<CarPartsGrid parts={[]} />);

      expect(screen.getByText(/No parts found/i)).toBeInTheDocument();
    });

    it("renders a single part correctly", () => {
      render(<CarPartsGrid parts={[mockParts[0]]} />);

      expect(screen.getByText("BMW M3 Brake Pads")).toBeInTheDocument();
      expect(screen.getByText("£149.99")).toBeInTheDocument();
    });

    it("handles parts without an image (shows placeholder)", () => {
      const partWithoutImage = createMockPart({
        _id: "part-no-img",
        name: "No Image Part",
        image: undefined,
      });
      render(<CarPartsGrid parts={[partWithoutImage]} />);

      expect(screen.getByText("No Image Part")).toBeInTheDocument();
      // Should not render an <img> tag — should show a placeholder
      const images = screen.queryAllByRole("img");
      expect(images.length).toBe(0);
    });
  });
});
