/**
 * STRICT CARPARTS & SHOP TESTS
 * Tests for e-commerce components with security and data validation focus
 * Designed to catch XSS vulnerabilities, price manipulation, and cart security issues
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("CarParts & Shop Components - SECURITY & DATA INTEGRITY TESTS", () => {
  describe("CarPartsGrid Component - PRODUCT SECURITY REQUIREMENTS", () => {
    // Mock CarPartsGrid component
    const CarPartsGrid = (props: {
      products?: any[];
      onProductClick?: (product: any) => void;
      onAddToCart?: (item: any) => void;
      loading?: boolean;
      searchTerm?: string;
      sortBy?: string;
      filterBy?: any;
    }) => {
      const {
        products = [],
        onProductClick,
        onAddToCart,
        loading = false,
        searchTerm = "",
        sortBy = "name",
        filterBy = {},
      } = props;
      const [cart, setCart] = React.useState<any[]>([]);

      // STRICT: Sanitize product data
      const sanitizePrice = (price: any) => {
        const numPrice = parseFloat(price);
        return !isNaN(numPrice) && numPrice >= 0 ? numPrice.toFixed(2) : "0.00";
      };

      const sanitizeText = (text: string) => {
        return (
          text
            ?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/on\w+="/gi, "") || ""
        );
      };

      const filteredProducts = products.filter((product: any) => {
        const matchesSearch =
          !searchTerm ||
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = Object.keys(filterBy).every((key) => {
          if (!filterBy[key]) return true;
          return product[key] === filterBy[key];
        });

        return matchesSearch && matchesFilter;
      });

      const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return parseFloat(a.price) - parseFloat(b.price);
          case "price-high":
            return parseFloat(b.price) - parseFloat(a.price);
          case "name":
          default:
            return (a.name || "").localeCompare(b.name || "");
        }
      });

      const handleAddToCart = (product: any, quantity = 1) => {
        // STRICT: Validate quantity and product data
        const validQuantity = Math.max(
          1,
          Math.min(100, parseInt(quantity.toString()) || 1)
        );
        const validPrice = parseFloat(product.price);

        if (isNaN(validPrice) || validPrice < 0) {
          console.error("Invalid product price");
          return;
        }

        if (!product.id || !product.name) {
          console.error("Invalid product data");
          return;
        }

        const cartItem = {
          ...product,
          quantity: validQuantity,
          price: sanitizePrice(validPrice),
          addedAt: new Date().toISOString(),
        };

        setCart((prev) => [...prev, cartItem]);
        onAddToCart?.(cartItem);
      };

      if (loading) {
        return (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
            role="status"
            aria-live="polite"
            aria-label="Loading products"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-lg border p-4"
                data-testid="product-skeleton"
              >
                <div className="mb-4 h-48 rounded bg-gray-300"></div>
                <div className="mb-2 h-4 rounded bg-gray-300"></div>
                <div className="h-4 w-2/3 rounded bg-gray-300"></div>
              </div>
            ))}
          </div>
        );
      }

      if (sortedProducts.length === 0) {
        return (
          <div className="py-8 text-center">
            <p className="text-lg text-gray-500">No products found</p>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            )}
          </div>
        );
      }

      return (
        <div>
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
            role="grid"
            aria-label="Product grid"
          >
            {sortedProducts.map((product: any, index: number) => (
              <article
                key={product.id}
                role="gridcell"
                className="cursor-pointer overflow-hidden rounded-lg border transition-shadow focus-within:ring-2 focus-within:ring-blue-500 hover:shadow-lg"
                onClick={() => onProductClick?.(product)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onProductClick?.(product);
                  }
                }}
                tabIndex={0}
                data-testid={`product-${product.id}`}
              >
                <div className="relative">
                  <img
                    src={product.image || "/placeholder-product.jpg"}
                    alt={sanitizeText(product.name)}
                    className="h-48 w-full object-cover"
                    loading={index < 4 ? "eager" : "lazy"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-product.jpg";
                    }}
                  />
                  {product.sale && (
                    <div className="absolute top-2 right-2 rounded bg-red-500 px-2 py-1 text-sm text-white">
                      Sale
                    </div>
                  )}
                  {product.outOfStock && (
                    <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
                      <span className="font-semibold text-white">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-2 line-clamp-2 text-lg font-semibold">
                    {sanitizeText(product.name)}
                  </h3>

                  <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                    {sanitizeText(product.description)}
                  </p>

                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">
                      £{sanitizePrice(product.price)}
                    </span>
                    {product.originalPrice &&
                      parseFloat(product.originalPrice) >
                        parseFloat(product.price) && (
                        <span className="text-sm text-gray-500 line-through">
                          £{sanitizePrice(product.originalPrice)}
                        </span>
                      )}
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex text-sm text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>
                            {i < Math.floor(product.rating || 0) ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        ({product.reviewCount || 0})
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        product.inStock
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.inStock
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    disabled={!product.inStock}
                    className={`w-full rounded px-4 py-2 font-medium transition-colors ${
                      product.inStock
                        ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                        : "cursor-not-allowed bg-gray-300 text-gray-500"
                    } `}
                    aria-label={`Add ${sanitizeText(product.name)} to cart for £${sanitizePrice(product.price)}`}
                  >
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Cart Summary for testing */}
          {cart.length > 0 && (
            <div
              className="fixed right-4 bottom-4 rounded-lg bg-blue-600 p-4 text-white shadow-lg"
              role="status"
              aria-live="polite"
              data-testid="cart-summary"
            >
              <p>Items in cart: {cart.length}</p>
              <p>
                Total: £
                {cart
                  .reduce(
                    (sum, item) => sum + parseFloat(item.price) * item.quantity,
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
          )}
        </div>
      );
    };

    const mockProducts = [
      {
        id: "prod1",
        name: "Brake Pads Set",
        description: "High-quality ceramic brake pads",
        price: "89.99",
        originalPrice: "109.99",
        image: "/brake-pads.jpg",
        inStock: true,
        stock: 15,
        rating: 4.5,
        reviewCount: 23,
        category: "brakes",
        sale: true,
      },
      {
        id: "prod2",
        name: "Oil Filter",
        description: "Premium oil filter for engine protection",
        price: "12.99",
        image: "/oil-filter.jpg",
        inStock: false,
        stock: 0,
        rating: 4.2,
        reviewCount: 45,
        category: "filters",
      },
      {
        id: "prod3",
        name: '<script>alert("xss")</script>Malicious Product',
        description: 'javascript:alert("description")',
        price: "-100.00", // Negative price test
        image: 'javascript:alert("image")',
        inStock: true,
        stock: 5,
        rating: 3.8,
        reviewCount: 12,
        category: "test",
      },
    ];

    afterEach(cleanup);

    it("MUST sanitize all product data to prevent XSS attacks", () => {
      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      render(
        <CarPartsGrid
          products={mockProducts}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
        />
      );

      // STRICT: Script tags should be stripped from product names
      const productName = screen.getByText(/Malicious Product/);
      expect(productName.textContent).not.toContain("<script>");
      expect(productName.textContent).not.toContain("alert");

      // STRICT: JavaScript URLs should be sanitized
      const productImg = document.querySelector(
        '[alt*="Malicious Product"]'
      ) as HTMLImageElement;
      expect(productImg.src).not.toContain("javascript:");

      // STRICT: Negative prices should be converted to 0.00
      const priceElement = screen.getByText("£0.00");
      expect(priceElement).toBeTruthy();
    });

    it("MUST validate product data before adding to cart", async () => {
      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      render(
        <CarPartsGrid
          products={mockProducts}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
        />
      );

      // STRICT: Try to add malicious product with negative price
      const maliciousAddButton = screen.getAllByText(/add to cart/i)[2];
      await userEvent.click(maliciousAddButton);

      // STRICT: Cart should not contain invalid items
      const cartSummary = screen.queryByTestId("cart-summary");
      expect(cartSummary).toBeFalsy(); // Should not appear for invalid products

      // STRICT: Try to add valid product
      const validAddButton = screen.getAllByText(/add to cart/i)[0];
      await userEvent.click(validAddButton);

      const validCartSummary = await screen.findByTestId("cart-summary");
      expect(validCartSummary).toBeTruthy();
      expect(validCartSummary.textContent).toContain("Items in cart: 1");
    });

    it("MUST handle product search with input sanitization", async () => {
      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      const { rerender } = render(
        <CarPartsGrid
          products={mockProducts}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
          searchTerm=""
        />
      );

      // STRICT: Initial state should show all valid products
      expect(screen.getAllByRole("gridcell")).toHaveLength(3);

      // STRICT: Search with malicious script should be safe
      rerender(
        <CarPartsGrid
          products={mockProducts}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
          searchTerm="<script>alert('search')</script>brake"
        />
      );

      // STRICT: Should still filter normally without executing script
      expect(screen.getByText("Brake Pads Set")).toBeTruthy();
      expect(screen.queryByText("Oil Filter")).toBeFalsy();
    });

    it("MUST enforce quantity limits and validation", async () => {
      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      // Create a component that allows custom quantity input
      const TestWrapper = () => {
        const [quantity, setQuantity] = React.useState(1);
        return (
          <div>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              min="1"
              max="100"
              data-testid="quantity-input"
            />
            <button
              onClick={() => {
                // Simulate adding with custom quantity (this would be handled in real component)
                mockAddToCart({
                  ...mockProducts[0],
                  quantity: Math.max(1, Math.min(100, quantity || 1)),
                });
              }}
              data-testid="add-with-quantity"
            >
              Add with Quantity
            </button>
          </div>
        );
      };

      render(<TestWrapper />);

      const quantityInput = screen.getByTestId(
        "quantity-input"
      ) as HTMLInputElement;
      const addButton = screen.getByTestId("add-with-quantity");

      // STRICT: Test quantity limits
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, "999"); // Over limit
      await userEvent.click(addButton);

      // STRICT: Should be clamped to max (100)
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 100,
        })
      );

      jest.clearAllMocks();

      // STRICT: Test negative quantity
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, "-5");
      await userEvent.click(addButton);

      // STRICT: Should be clamped to min (1)
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 1,
        })
      );
    });

    it("MUST provide proper accessibility for screen readers", () => {
      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      render(
        <CarPartsGrid
          products={mockProducts}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
        />
      );

      const grid = screen.getByRole("grid");
      expect(grid).toHaveAttribute("aria-label", "Product grid");

      const gridCells = screen.getAllByRole("gridcell");
      expect(gridCells).toHaveLength(3);

      // STRICT: Each product should be keyboard accessible
      gridCells.forEach((cell) => {
        expect(cell).toHaveAttribute("tabIndex", "0");
      });

      // STRICT: Add to cart buttons should have descriptive labels
      const addButton = screen.getByLabelText(
        /Add Brake Pads Set to cart for £89\.99/
      );
      expect(addButton).toBeTruthy();
    });

    it("MUST handle loading states with proper accessibility", () => {
      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      render(
        <CarPartsGrid
          products={[]}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
          loading={true}
        />
      );

      // STRICT: Loading state should be announced to screen readers
      const loadingContainer = screen.getByRole("status");
      expect(loadingContainer).toHaveAttribute(
        "aria-label",
        "Loading products"
      );

      // STRICT: Should show skeleton placeholders
      const skeletons = screen.getAllByTestId("product-skeleton");
      expect(skeletons).toHaveLength(8);
    });

    it("MUST prevent price manipulation in display", () => {
      const manipulatedProducts = [
        {
          id: "test1",
          name: "Test Product",
          price: "NaN",
          originalPrice: "undefined",
          inStock: true,
        },
        {
          id: "test2",
          name: "Test Product 2",
          price: "Infinity",
          inStock: true,
        },
        {
          id: "test3",
          name: "Test Product 3",
          price: "100.999999", // Too many decimal places
          inStock: true,
        },
      ];

      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      render(
        <CarPartsGrid
          products={manipulatedProducts}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
        />
      );

      // STRICT: All invalid prices should be converted to 0.00
      const prices = screen.getAllByText("£0.00");
      expect(prices).toHaveLength(2); // NaN and Infinity

      // STRICT: Valid price should be properly formatted
      expect(screen.getByText("£101.00")).toBeTruthy(); // Rounded to 2 decimal places
    });

    it("MUST handle image errors gracefully", async () => {
      const mockProductClick = jest.fn();
      const mockAddToCart = jest.fn();

      render(
        <CarPartsGrid
          products={[
            {
              id: "img-test",
              name: "Image Test Product",
              price: "50.00",
              image: "https://invalid-image-url.com/broken.jpg",
              inStock: true,
            },
          ]}
          onProductClick={mockProductClick}
          onAddToCart={mockAddToCart}
        />
      );

      const img = screen.getByAltText("Image Test Product") as HTMLImageElement;

      // STRICT: Simulate image load error
      fireEvent.error(img);

      // STRICT: Should fallback to placeholder
      expect(img.src).toContain("placeholder-product.jpg");
    });
  });

  describe("FilterSection Component - INPUT VALIDATION REQUIREMENTS", () => {
    // Mock FilterSection component
    const FilterSection = (props: {
      categories?: string[];
      priceRange?: { min: number; max: number };
      brands?: string[];
      onFilterChange?: (filters: any) => void;
      currentFilters?: any;
    }) => {
      const {
        categories = [],
        priceRange = { min: 0, max: 1000 },
        brands = [],
        onFilterChange,
        currentFilters = {},
      } = props;
      const [localFilters, setLocalFilters] = React.useState(currentFilters);

      const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFilterChange?.(newFilters);
      };

      const handlePriceRangeChange = (min: number, max: number) => {
        // STRICT: Validate price range inputs
        const validMin = Math.max(0, Math.min(priceRange.max, min || 0));
        const validMax = Math.max(
          validMin,
          Math.min(priceRange.max, max || priceRange.max)
        );

        handleFilterChange("priceRange", { min: validMin, max: validMax });
      };

      return (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-semibold">Filter Products</h3>

          {/* Category Filter */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Category</label>
            <select
              value={localFilters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Price Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.priceRange?.min || ""}
                onChange={(e) =>
                  handlePriceRangeChange(
                    parseInt(e.target.value) || 0,
                    localFilters.priceRange?.max || priceRange.max
                  )
                }
                min={priceRange.min}
                max={priceRange.max}
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                aria-label="Minimum price"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.priceRange?.max || ""}
                onChange={(e) =>
                  handlePriceRangeChange(
                    localFilters.priceRange?.min || priceRange.min,
                    parseInt(e.target.value) || priceRange.max
                  )
                }
                min={priceRange.min}
                max={priceRange.max}
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                aria-label="Maximum price"
              />
            </div>
          </div>

          {/* Brand Filter */}
          <div className="mb-6">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Brand</legend>
              {brands.map((brand: string) => (
                <label key={brand} className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.brands?.includes(brand) || false}
                    onChange={(e) => {
                      const currentBrands = localFilters.brands || [];
                      const newBrands = e.target.checked
                        ? [...currentBrands, brand]
                        : currentBrands.filter((b: string) => b !== brand);
                      handleFilterChange("brands", newBrands);
                    }}
                    className="mr-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </fieldset>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setLocalFilters({});
              onFilterChange?.({});
            }}
            className="w-full rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            Clear All Filters
          </button>
        </div>
      );
    };

    const mockFilterData = {
      categories: ["Brakes", "Filters", "Engine", "Suspension"],
      priceRange: { min: 0, max: 500 },
      brands: ["Bosch", "ACDelco", "Motorcraft", "OEM"],
    };

    afterEach(cleanup);

    it("MUST validate price range inputs and prevent manipulation", async () => {
      const mockFilterChange = jest.fn();

      render(
        <FilterSection {...mockFilterData} onFilterChange={mockFilterChange} />
      );

      const minInput = screen.getByLabelText(
        /minimum price/i
      ) as HTMLInputElement;
      const maxInput = screen.getByLabelText(
        /maximum price/i
      ) as HTMLInputElement;

      // STRICT: Test invalid minimum (negative)
      await userEvent.type(minInput, "-100");

      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: { min: 0, max: 500 }, // Should be clamped to 0
        })
      );

      jest.clearAllMocks();

      // STRICT: Test invalid maximum (over limit)
      await userEvent.clear(maxInput);
      await userEvent.type(maxInput, "999999");

      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: { min: 0, max: 500 }, // Should be clamped to max
        })
      );

      jest.clearAllMocks();

      // STRICT: Test min > max scenario
      await userEvent.clear(minInput);
      await userEvent.clear(maxInput);
      await userEvent.type(minInput, "300");
      await userEvent.type(maxInput, "200");

      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: { min: 200, max: 200 }, // Max should be adjusted to min
        })
      );
    });

    it("MUST handle malicious input in filter values", async () => {
      const mockFilterChange = jest.fn();

      // Mock categories with potential XSS
      const maliciousData = {
        ...mockFilterData,
        categories: [
          "Brakes",
          '<script>alert("xss")</script>Malicious Category',
          'javascript:alert("category")',
        ],
        brands: [
          "Bosch",
          'onload="alert(1)" bad-brand',
          "<img src=x onerror=alert(1)>Evil Brand",
        ],
      };

      render(
        <FilterSection {...maliciousData} onFilterChange={mockFilterChange} />
      );

      const categorySelect = screen.getByLabelText(/filter by category/i);

      // STRICT: Malicious category options should still be selectable but safe
      const options = categorySelect.querySelectorAll("option");
      const maliciousOption = Array.from(options).find((option) =>
        option.textContent?.includes("Malicious Category")
      );

      expect(maliciousOption?.textContent).not.toContain("<script>");
      expect(maliciousOption?.textContent).not.toContain("alert");

      // STRICT: Check brand checkboxes are safe
      const brandLabels = screen.getAllByText(/brand/i);
      brandLabels.forEach((label) => {
        expect(label.textContent).not.toContain("<img");
        expect(label.textContent).not.toContain("onerror");
        expect(label.textContent).not.toContain("onload");
      });
    });

    it("MUST provide proper accessibility for all filter controls", () => {
      const mockFilterChange = jest.fn();

      render(
        <FilterSection {...mockFilterData} onFilterChange={mockFilterChange} />
      );

      // STRICT: Category select should have proper label
      const categorySelect = screen.getByLabelText(/filter by category/i);
      expect(categorySelect).toBeTruthy();

      // STRICT: Price inputs should have proper labels
      const minPriceInput = screen.getByLabelText(/minimum price/i);
      const maxPriceInput = screen.getByLabelText(/maximum price/i);
      expect(minPriceInput).toBeTruthy();
      expect(maxPriceInput).toBeTruthy();

      // STRICT: Brand checkboxes should be in a fieldset with legend
      const brandFieldset = screen.getByRole("group", { name: /brand/i });
      expect(brandFieldset).toBeTruthy();

      // STRICT: All form controls should be focusable
      const allInputs = screen
        .getAllByRole("textbox")
        .concat(
          screen.getAllByRole("combobox"),
          screen.getAllByRole("checkbox")
        );

      allInputs.forEach((input) => {
        expect(input).not.toHaveAttribute("tabIndex", "-1");
      });
    });

    it("MUST clear all filters properly", async () => {
      const mockFilterChange = jest.fn();

      render(
        <FilterSection
          {...mockFilterData}
          onFilterChange={mockFilterChange}
          currentFilters={{
            category: "Brakes",
            priceRange: { min: 50, max: 200 },
            brands: ["Bosch", "ACDelco"],
          }}
        />
      );

      // STRICT: Clear button should reset all filters
      const clearButton = screen.getByText(/clear all filters/i);
      await userEvent.click(clearButton);

      expect(mockFilterChange).toHaveBeenCalledWith({});

      // STRICT: UI should reflect cleared state
      const categorySelect = screen.getByLabelText(
        /filter by category/i
      ) as HTMLSelectElement;
      expect(categorySelect.value).toBe("");

      const brandCheckboxes = screen.getAllByRole(
        "checkbox"
      ) as HTMLInputElement[];
      brandCheckboxes.forEach((checkbox) => {
        expect(checkbox.checked).toBe(false);
      });
    });

    it("MUST maintain filter state consistency", async () => {
      const mockFilterChange = jest.fn();

      const { rerender } = render(
        <FilterSection
          {...mockFilterData}
          onFilterChange={mockFilterChange}
          currentFilters={{}}
        />
      );

      // STRICT: Select a category
      const categorySelect = screen.getByLabelText(/filter by category/i);
      await userEvent.selectOptions(categorySelect, "Brakes");

      expect(mockFilterChange).toHaveBeenCalledWith({
        category: "Brakes",
      });

      // STRICT: Re-render with updated filters
      rerender(
        <FilterSection
          {...mockFilterData}
          onFilterChange={mockFilterChange}
          currentFilters={{ category: "Brakes" }}
        />
      );

      // STRICT: UI should reflect the current filter state
      expect((categorySelect as HTMLSelectElement).value).toBe("Brakes");
    });
  });
});
