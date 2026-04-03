/**
 * @jest-environment node
 *
 * Tests for car filtering utilities (src/lib/utils/filterCars.ts)
 *
 * Standards coverage:
 * - 📋 Functional: Multi-criteria filtering, search functionality
 * - 🔒 Security: XSS prevention in search terms, injection prevention
 * - ⚡ Performance: Efficient filtering of large datasets
 */
import { filterCars } from "@/lib/utils/filterCars";
import { CarInterface } from "@/lib/interfaces";
import { FilterState } from "@/contexts/FilterContext";

describe("Car Filtering Utilities", () => {
  // Sample test data
  const testCars: CarInterface[] = [
    {
      _id: "1",
      make: "Toyota",
      model: "Camry",
      year: 2023,
      price: 25000,
      mileage: 15000,
      fuel: "Petrol",
      transmission: "Automatic",
      doors: 4,
      colour: "White",
      status: "available",
      featured: false,
      features: ["Navigation", "Leather Seats"],
      description: "Well maintained",
      image: "camry.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "2",
      make: "Honda",
      model: "Civic",
      year: 2022,
      price: 20000,
      mileage: 25000,
      fuel: "Petrol",
      transmission: "Manual",
      doors: 4,
      colour: "Black",
      status: "available",
      featured: false,
      features: ["Bluetooth", "Cruise Control"],
      description: "Sporty and efficient",
      image: "civic.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "3",
      make: "BMW",
      model: "X5",
      year: 2024,
      price: 55000,
      mileage: 5000,
      fuel: "Diesel",
      transmission: "Automatic",
      doors: 5,
      colour: "Blue",
      status: "sold",
      featured: false,
      features: ["Navigation", "Leather Seats", "Sunroof"],
      description: "Luxury SUV",
      image: "x5.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "4",
      make: "Toyota",
      model: "Corolla",
      year: 2021,
      price: 18000,
      mileage: 30000,
      fuel: "Hybrid",
      transmission: "Automatic",
      doors: 4,
      colour: "White",
      status: "available",
      featured: false,
      features: ["Bluetooth"],
      description: "Eco-friendly option",
      image: "corolla.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "5",
      make: "Ford",
      model: "Mustang",
      year: 2023,
      price: 45000,
      mileage: 8000,
      fuel: "Petrol",
      transmission: "Manual",
      doors: 2,
      colour: "Red",
      status: "available",
      featured: false,
      features: ["Navigation", "Premium Sound"],
      description: "Sports car",
      image: "mustang.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultFilters: FilterState = {
    searchTerm: "",
    statusFilter: "all",
    make: "all",
    yearMin: null,
    yearMax: null,
    priceMin: null,
    priceMax: null,
    mileageMin: null,
    mileageMax: null,
    doors: "all",
    colour: "all",
    features: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("\ud83d\udccb Functional Standards - Search Functionality", () => {
    it("should return all cars with empty search term", () => {
      const result = filterCars(testCars, defaultFilters);
      expect(result.length).toBe(5);
    });

    it("should filter by make in search term", () => {
      const filters = { ...defaultFilters, searchTerm: "Toyota" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.make === "Toyota")).toBe(true);
    });

    it("should filter by model in search term", () => {
      const filters = { ...defaultFilters, searchTerm: "Camry" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(1);
      expect(result[0].model).toBe("Camry");
    });

    it("should filter by year in search term", () => {
      const filters = { ...defaultFilters, searchTerm: "2023" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.year === 2023)).toBe(true);
    });

    it("should filter by colour in search term", () => {
      const filters = { ...defaultFilters, searchTerm: "White" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.colour === "White")).toBe(true);
    });

    it("should be case-insensitive", () => {
      const filters1 = { ...defaultFilters, searchTerm: "TOYOTA" };
      const filters2 = { ...defaultFilters, searchTerm: "toyota" };
      const filters3 = { ...defaultFilters, searchTerm: "ToYoTa" };

      const result1 = filterCars(testCars, filters1);
      const result2 = filterCars(testCars, filters2);
      const result3 = filterCars(testCars, filters3);

      expect(result1.length).toBe(2);
      expect(result2.length).toBe(2);
      expect(result3.length).toBe(2);
    });

    it("should search across multiple fields", () => {
      // Search uses includes() on concatenated "make model year colour"
      // "Toyota Camry 2023 White" contains "Camry 2023" as a substring
      const filters = { ...defaultFilters, searchTerm: "Camry 2023" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(1);
      expect(result[0].make).toBe("Toyota");
      expect(result[0].year).toBe(2023);
    });

    it("should return empty array for no matches", () => {
      const filters = { ...defaultFilters, searchTerm: "NonExistent" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(0);
    });
  });

  describe("\ud83d\udccb Functional Standards - Status Filter", () => {
    it("should filter by available status", () => {
      const filters = { ...defaultFilters, statusFilter: "available" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(4);
      expect(result.every((car) => car.status === "available")).toBe(true);
    });

    it("should filter by sold status", () => {
      const filters = { ...defaultFilters, statusFilter: "sold" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(1);
      expect(result[0].status).toBe("sold");
    });

    it("should show all cars when status is 'all'", () => {
      const filters = { ...defaultFilters, statusFilter: "all" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(5);
    });
  });

  describe("\ud83d\udccb Functional Standards - Make Filter", () => {
    it("should filter by specific make", () => {
      const filters = { ...defaultFilters, make: "Toyota" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.make === "Toyota")).toBe(true);
    });

    it("should show all cars when make is 'all'", () => {
      const filters = { ...defaultFilters, make: "all" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(5);
    });

    it("should handle makes with no matches", () => {
      const filters = { ...defaultFilters, make: "Tesla" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(0);
    });
  });

  describe("\ud83d\udccb Functional Standards - Year Range Filter", () => {
    it("should filter by minimum year", () => {
      const filters = { ...defaultFilters, yearMin: 2023 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(3);
      expect(result.every((car) => car.year >= 2023)).toBe(true);
    });

    it("should filter by maximum year", () => {
      const filters = { ...defaultFilters, yearMax: 2022 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.year <= 2022)).toBe(true);
    });

    it("should filter by year range", () => {
      const filters = { ...defaultFilters, yearMin: 2022, yearMax: 2023 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(3);
      expect(result.every((car) => car.year >= 2022 && car.year <= 2023)).toBe(
        true
      );
    });

    it("should handle null year filters", () => {
      const filters = { ...defaultFilters, yearMin: null, yearMax: null };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(5);
    });
  });

  describe("\ud83d\udccb Functional Standards - Price Range Filter", () => {
    it("should filter by minimum price", () => {
      const filters = { ...defaultFilters, priceMin: 40000 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.price >= 40000)).toBe(true);
    });

    it("should filter by maximum price", () => {
      const filters = { ...defaultFilters, priceMax: 25000 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(3);
      expect(result.every((car) => car.price <= 25000)).toBe(true);
    });

    it("should filter by price range", () => {
      const filters = { ...defaultFilters, priceMin: 20000, priceMax: 30000 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(
        result.every((car) => car.price >= 20000 && car.price <= 30000)
      ).toBe(true);
    });

    it("should handle exact price match", () => {
      const filters = { ...defaultFilters, priceMin: 25000, priceMax: 25000 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(1);
      expect(result[0].price).toBe(25000);
    });
  });

  describe("\ud83d\udccb Functional Standards - Mileage Range Filter", () => {
    it("should filter by minimum mileage", () => {
      const filters = { ...defaultFilters, mileageMin: 20000 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.mileage >= 20000)).toBe(true);
    });

    it("should filter by maximum mileage", () => {
      const filters = { ...defaultFilters, mileageMax: 15000 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(3);
      expect(result.every((car) => car.mileage <= 15000)).toBe(true);
    });

    it("should filter by mileage range", () => {
      const filters = {
        ...defaultFilters,
        mileageMin: 10000,
        mileageMax: 25000,
      };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(
        result.every((car) => car.mileage >= 10000 && car.mileage <= 25000)
      ).toBe(true);
    });
  });

  describe("\ud83d\udccb Functional Standards - Doors Filter", () => {
    it("should filter by number of doors", () => {
      const filters = { ...defaultFilters, doors: "4" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(3);
      expect(result.every((car) => car.doors === 4)).toBe(true);
    });

    it("should show all cars when doors is 'all'", () => {
      const filters = { ...defaultFilters, doors: "all" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(5);
    });

    it("should filter 2-door cars", () => {
      const filters = { ...defaultFilters, doors: "2" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(1);
      expect(result[0].doors).toBe(2);
    });
  });

  describe("\ud83d\udccb Functional Standards - Colour Filter", () => {
    it("should filter by specific colour", () => {
      const filters = { ...defaultFilters, colour: "White" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.colour === "White")).toBe(true);
    });

    it("should show all cars when colour is 'all'", () => {
      const filters = { ...defaultFilters, colour: "all" };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(5);
    });
  });

  describe("\ud83d\udccb Functional Standards - Features Filter", () => {
    it("should filter by single feature", () => {
      const filters = { ...defaultFilters, features: ["Navigation"] };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(3);
      expect(result.every((car) => car.features?.includes("Navigation"))).toBe(
        true
      );
    });

    it("should filter by multiple features (AND logic)", () => {
      const filters = {
        ...defaultFilters,
        features: ["Navigation", "Leather Seats"],
      };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(2);
      expect(
        result.every(
          (car) =>
            car.features?.includes("Navigation") &&
            car.features?.includes("Leather Seats")
        )
      ).toBe(true);
    });

    it("should return all cars when features array is empty", () => {
      const filters = { ...defaultFilters, features: [] };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(5);
    });

    it("should handle cars without features array", () => {
      const carsWithoutFeatures = [
        { ...testCars[0], features: undefined },
      ] as CarInterface[];

      const filters = { ...defaultFilters, features: ["Navigation"] };
      const result = filterCars(carsWithoutFeatures, filters);

      expect(result.length).toBe(0);
    });
  });

  describe("\ud83d\udccb Functional Standards - Combined Filters", () => {
    it("should apply multiple filters simultaneously", () => {
      const filters: FilterState = {
        ...defaultFilters,
        searchTerm: "Toyota",
        statusFilter: "available",
        priceMax: 20000,
      };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(1);
      expect(result[0].make).toBe("Toyota");
      expect(result[0].status).toBe("available");
      expect(result[0].price).toBeLessThanOrEqual(20000);
    });

    it("should narrow results with each additional filter", () => {
      // Start with all cars
      const result1 = filterCars(testCars, defaultFilters);
      expect(result1.length).toBe(5);

      // Add status filter
      const filters2 = { ...defaultFilters, statusFilter: "available" };
      const result2 = filterCars(testCars, filters2);
      expect(result2.length).toBeLessThanOrEqual(result1.length);

      // Add make filter
      const filters3 = { ...filters2, make: "Toyota" };
      const result3 = filterCars(testCars, filters3);
      expect(result3.length).toBeLessThanOrEqual(result2.length);
    });

    it("should return empty array when no cars match all criteria", () => {
      const filters: FilterState = {
        ...defaultFilters,
        make: "Toyota",
        yearMin: 2024,
        priceMax: 10000,
      };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(0);
    });
  });

  describe("\ud83d\udd12 Security Standards - XSS Prevention", () => {
    it("should handle script tags in search term", () => {
      const filters = {
        ...defaultFilters,
        searchTerm: "<script>alert('xss')</script>",
      };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(0);
      expect(() => filterCars(testCars, filters)).not.toThrow();
    });

    it("should handle HTML injection in search term", () => {
      const filters = {
        ...defaultFilters,
        searchTerm: "<img onerror='alert(1)' />",
      };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(0);
      expect(() => filterCars(testCars, filters)).not.toThrow();
    });

    it("should handle SQL injection patterns", () => {
      const filters = {
        ...defaultFilters,
        searchTerm: "'; DROP TABLE cars; --",
      };
      const result = filterCars(testCars, filters);

      expect(() => filterCars(testCars, filters)).not.toThrow();
    });

    it("should handle special regex characters", () => {
      const specialChars = [
        ".",
        "*",
        "+",
        "?",
        "^",
        "$",
        "[",
        "]",
        "(",
        ")",
        "|",
      ];

      specialChars.forEach((char) => {
        const filters = { ...defaultFilters, searchTerm: char };
        expect(() => filterCars(testCars, filters)).not.toThrow();
      });
    });
  });

  describe("\u26a1 Performance Standards", () => {
    it("should handle large datasets efficiently", () => {
      const largeCars = Array.from({ length: 1000 }, (_, i) => ({
        ...testCars[0],
        _id: `car-${i}`,
        make: i % 2 === 0 ? "Toyota" : "Honda",
        year: 2020 + (i % 5),
        price: 15000 + i * 100,
      }));

      const start = Date.now();
      const result = filterCars(largeCars, {
        ...defaultFilters,
        make: "Toyota",
      });
      const duration = Date.now() - start;

      expect(result.length).toBe(500);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it("should handle empty array efficiently", () => {
      const result = filterCars([], defaultFilters);
      expect(result.length).toBe(0);
    });

    it("should handle single car efficiently", () => {
      const result = filterCars([testCars[0]], defaultFilters);
      expect(result.length).toBe(1);
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("should handle null or undefined values gracefully", () => {
      const carsWithNulls = [
        { ...testCars[0], make: null, model: undefined } as any,
      ];

      expect(() => filterCars(carsWithNulls, defaultFilters)).not.toThrow();
    });

    it("should handle extremely long search terms", () => {
      const longSearch = "a".repeat(10000);
      const filters = { ...defaultFilters, searchTerm: longSearch };

      expect(() => filterCars(testCars, filters)).not.toThrow();
    });

    it("should handle negative price values", () => {
      const filters = { ...defaultFilters, priceMin: -1000, priceMax: -500 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBe(0);
    });

    it("should handle inverted ranges", () => {
      const filters = { ...defaultFilters, yearMin: 2024, yearMax: 2020 };
      const result = filterCars(testCars, filters);

      // Should return 0 since min > max
      expect(result.length).toBe(0);
    });

    it("should handle zero values", () => {
      const filters = { ...defaultFilters, priceMin: 0, mileageMin: 0 };
      const result = filterCars(testCars, filters);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should preserve original array", () => {
      const originalLength = testCars.length;
      const originalCars = [...testCars];

      filterCars(testCars, { ...defaultFilters, make: "Toyota" });

      expect(testCars.length).toBe(originalLength);
      expect(testCars).toEqual(originalCars);
    });
  });
});
