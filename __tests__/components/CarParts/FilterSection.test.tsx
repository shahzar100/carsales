/**
 * FILTERSECTION COMPONENT TESTS (TDD — written before implementation)
 *
 * Tests the updated FilterSection component that:
 * - Accepts dynamic brand/category/condition arrays as props (not hardcoded)
 * - Renders filter controls (brand dropdown, category dropdown, condition dropdown)
 * - Calls filter callbacks when filter values change
 *
 * Standards coverage:
 * - 📋 Functional: Filter rendering, callback invocation
 * - 🎯 Usability: All filter options render correctly, dynamic options
 */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import FilterSection from "@/components/CarParts/FilterSection";

// ── Mocks ────────────────────────────────────────────────────

// Mock CustomDropdown — render native <select> for test simplicity
jest.mock("@/components/CarParts/CustomDropdown", () => {
  return function MockCustomDropdown(props: {
    options: { value: string; label: string }[];
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
  }) {
    return (
      <select
        data-testid={`dropdown-${props.placeholder.toLowerCase().replace(/\s+/g, "-")}`}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-label={props.placeholder}
      >
        {props.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
});

// ── Test Data ────────────────────────────────────────────────

const defaultProps = {
  brands: ["Audi", "BMW", "Honda", "Toyota"],
  categories: ["Brakes", "Engine", "Exhaust", "Lighting"],
  conditionFilters: ["New", "Refurbished", "Used"],
  selectedBrand: "",
  selectedCategory: "",
  selectedCondition: "",
  onBrandChange: jest.fn(),
  onCategoryChange: jest.fn(),
  onConditionChange: jest.fn(),
};

// ── Tests ────────────────────────────────────────────────────

describe("FilterSection Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Rendering ──────────────────────────────────────────────
  describe("Rendering", () => {
    it("renders all three filter dropdowns", () => {
      render(<FilterSection {...defaultProps} />);

      expect(screen.getByTestId("dropdown-all-brands")).toBeInTheDocument();
      expect(screen.getByTestId("dropdown-all-categories")).toBeInTheDocument();
      expect(screen.getByTestId("dropdown-all-conditions")).toBeInTheDocument();
    });

    it("renders brand dropdown with dynamic brand options from props", () => {
      render(<FilterSection {...defaultProps} />);

      const brandDropdown = screen.getByTestId("dropdown-all-brands");
      const options = brandDropdown.querySelectorAll("option");

      // "All Brands" + 4 brands
      expect(options.length).toBe(5);
      expect(options[0].textContent).toBe("All Brands");
      expect(options[1].textContent).toBe("Audi");
      expect(options[2].textContent).toBe("BMW");
      expect(options[3].textContent).toBe("Honda");
      expect(options[4].textContent).toBe("Toyota");
    });

    it("renders category dropdown with dynamic category options from props", () => {
      render(<FilterSection {...defaultProps} />);

      const categoryDropdown = screen.getByTestId("dropdown-all-categories");
      const options = categoryDropdown.querySelectorAll("option");

      // "All Categories" + 4 categories
      expect(options.length).toBe(5);
      expect(options[0].textContent).toBe("All Categories");
      expect(options[1].textContent).toBe("Brakes");
    });

    it("renders condition dropdown with dynamic condition options from props", () => {
      render(<FilterSection {...defaultProps} />);

      const conditionDropdown = screen.getByTestId("dropdown-all-conditions");
      const options = conditionDropdown.querySelectorAll("option");

      // "All Conditions" + 3 conditions
      expect(options.length).toBe(4);
      expect(options[0].textContent).toBe("All Conditions");
      expect(options[1].textContent).toBe("New");
      expect(options[2].textContent).toBe("Refurbished");
      expect(options[3].textContent).toBe("Used");
    });

    it("accepts dynamic brand/category/condition options as props", () => {
      const customProps = {
        ...defaultProps,
        brands: ["Mercedes", "Volkswagen"],
        categories: ["Wheels", "Cooling"],
        conditionFilters: ["New"],
      };

      render(<FilterSection {...customProps} />);

      const brandDropdown = screen.getByTestId("dropdown-all-brands");
      const brandOptions = brandDropdown.querySelectorAll("option");
      // "All Brands" + 2 custom brands
      expect(brandOptions.length).toBe(3);
      expect(brandOptions[1].textContent).toBe("Mercedes");
      expect(brandOptions[2].textContent).toBe("Volkswagen");

      const categoryDropdown = screen.getByTestId("dropdown-all-categories");
      const categoryOptions = categoryDropdown.querySelectorAll("option");
      expect(categoryOptions.length).toBe(3);

      const conditionDropdown = screen.getByTestId("dropdown-all-conditions");
      const conditionOptions = conditionDropdown.querySelectorAll("option");
      // "All Conditions" + 1 condition
      expect(conditionOptions.length).toBe(2);
    });
  });

  // ── Filter Callbacks ───────────────────────────────────────
  describe("Filter Callbacks", () => {
    it("calls onBrandChange when brand filter is changed", () => {
      render(<FilterSection {...defaultProps} />);

      const brandDropdown = screen.getByTestId("dropdown-all-brands");
      fireEvent.change(brandDropdown, { target: { value: "BMW" } });

      expect(defaultProps.onBrandChange).toHaveBeenCalledTimes(1);
      expect(defaultProps.onBrandChange).toHaveBeenCalledWith("BMW");
    });

    it("calls onCategoryChange when category filter is changed", () => {
      render(<FilterSection {...defaultProps} />);

      const categoryDropdown = screen.getByTestId("dropdown-all-categories");
      fireEvent.change(categoryDropdown, { target: { value: "Brakes" } });

      expect(defaultProps.onCategoryChange).toHaveBeenCalledTimes(1);
      expect(defaultProps.onCategoryChange).toHaveBeenCalledWith("Brakes");
    });

    it("calls onConditionChange when condition filter is changed", () => {
      render(<FilterSection {...defaultProps} />);

      const conditionDropdown = screen.getByTestId("dropdown-all-conditions");
      fireEvent.change(conditionDropdown, { target: { value: "New" } });

      expect(defaultProps.onConditionChange).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConditionChange).toHaveBeenCalledWith("New");
    });

    it("calls onBrandChange with empty string when 'All Brands' is selected", () => {
      const props = { ...defaultProps, selectedBrand: "BMW" };
      render(<FilterSection {...props} />);

      const brandDropdown = screen.getByTestId("dropdown-all-brands");
      fireEvent.change(brandDropdown, { target: { value: "" } });

      expect(defaultProps.onBrandChange).toHaveBeenCalledWith("");
    });
  });

  // ── Selected State ─────────────────────────────────────────
  describe("Selected State", () => {
    it("reflects selected brand value in the dropdown", () => {
      const props = { ...defaultProps, selectedBrand: "Honda" };
      render(<FilterSection {...props} />);

      const brandDropdown = screen.getByTestId(
        "dropdown-all-brands"
      ) as HTMLSelectElement;
      expect(brandDropdown.value).toBe("Honda");
    });

    it("reflects selected category value in the dropdown", () => {
      const props = { ...defaultProps, selectedCategory: "Engine" };
      render(<FilterSection {...props} />);

      const categoryDropdown = screen.getByTestId(
        "dropdown-all-categories"
      ) as HTMLSelectElement;
      expect(categoryDropdown.value).toBe("Engine");
    });

    it("reflects selected condition value in the dropdown", () => {
      const props = { ...defaultProps, selectedCondition: "Refurbished" };
      render(<FilterSection {...props} />);

      const conditionDropdown = screen.getByTestId(
        "dropdown-all-conditions"
      ) as HTMLSelectElement;
      expect(conditionDropdown.value).toBe("Refurbished");
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────
  describe("Edge Cases", () => {
    it("renders with empty brand/category/condition arrays", () => {
      const props = {
        ...defaultProps,
        brands: [],
        categories: [],
        conditions: [],
      };
      render(<FilterSection {...props} />);

      // Should still render the dropdowns with just the "All" option
      const brandDropdown = screen.getByTestId("dropdown-all-brands");
      const brandOptions = brandDropdown.querySelectorAll("option");
      expect(brandOptions.length).toBe(1); // Only "All Brands"
    });
  });
});
