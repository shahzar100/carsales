/**
 * Tests for FilterContext (src/contexts/FilterContext.tsx)
 *
 * Standards coverage:
 * - 📋 Functional: Filter state management, all action types
 * - 🎯 Usability: Default state, reset functionality
 */
import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  FilterProvider,
  useFilters,
  type FilterState,
  type FilterAction,
} from "@/contexts/FilterContext";

// Test consumer that exposes state and dispatch
const TestConsumer = ({
  onState,
}: {
  onState?: (state: FilterState) => void;
}) => {
  const { state, dispatch } = useFilters();
  React.useEffect(() => {
    onState?.(state);
  }, [state, onState]);

  return (
    <div>
      <span data-testid="searchTerm">{state.searchTerm}</span>
      <span data-testid="statusFilter">{state.statusFilter}</span>
      <span data-testid="make">{state.make}</span>
      <span data-testid="doors">{state.doors}</span>
      <span data-testid="colour">{state.colour}</span>
      <span data-testid="priceMin">{state.priceMin ?? "null"}</span>
      <span data-testid="priceMax">{state.priceMax ?? "null"}</span>
      <span data-testid="yearMin">{state.yearMin ?? "null"}</span>
      <span data-testid="yearMax">{state.yearMax ?? "null"}</span>
      <span data-testid="mileageMin">{state.mileageMin ?? "null"}</span>
      <span data-testid="mileageMax">{state.mileageMax ?? "null"}</span>
      <span data-testid="features">{JSON.stringify(state.features)}</span>
      <button
        onClick={() => dispatch({ type: "SET_SEARCH_TERM", payload: "Toyota" })}
      >
        Search Toyota
      </button>
      <button
        onClick={() =>
          dispatch({ type: "SET_STATUS_FILTER", payload: "available" })
        }
      >
        Filter Available
      </button>
      <button
        onClick={() => dispatch({ type: "SET_PRICE_MIN", payload: 5000 })}
      >
        Set Min Price
      </button>
      <button
        onClick={() => dispatch({ type: "SET_PRICE_MAX", payload: 50000 })}
      >
        Set Max Price
      </button>
      <button onClick={() => dispatch({ type: "SET_MAKE", payload: "Honda" })}>
        Set Make
      </button>
      <button onClick={() => dispatch({ type: "SET_YEAR_MIN", payload: 2020 })}>
        Set Year Min
      </button>
      <button onClick={() => dispatch({ type: "SET_YEAR_MAX", payload: 2024 })}>
        Set Year Max
      </button>
      <button
        onClick={() => dispatch({ type: "SET_MILEAGE_MIN", payload: 1000 })}
      >
        Set Mileage Min
      </button>
      <button
        onClick={() => dispatch({ type: "SET_MILEAGE_MAX", payload: 100000 })}
      >
        Set Mileage Max
      </button>
      <button onClick={() => dispatch({ type: "SET_DOORS", payload: "4" })}>
        Set Doors
      </button>
      <button onClick={() => dispatch({ type: "SET_COLOUR", payload: "Red" })}>
        Set Colour
      </button>
      <button
        onClick={() =>
          dispatch({
            type: "SET_FEATURES",
            payload: ["Bluetooth", "GPS"],
          })
        }
      >
        Set Features
      </button>
      <button
        onClick={() =>
          dispatch({ type: "TOGGLE_FEATURE", payload: "Bluetooth" })
        }
      >
        Toggle Bluetooth
      </button>
      <button onClick={() => dispatch({ type: "RESET_FILTERS" })}>Reset</button>
    </div>
  );
};

describe("FilterContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("📋 Functional Standards - Default State", () => {
    it("should provide default filter state", () => {
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      expect(screen.getByTestId("searchTerm")).toHaveTextContent("");
      expect(screen.getByTestId("statusFilter")).toHaveTextContent("all");
      expect(screen.getByTestId("make")).toHaveTextContent("all");
      expect(screen.getByTestId("doors")).toHaveTextContent("all");
      expect(screen.getByTestId("colour")).toHaveTextContent("all");
      expect(screen.getByTestId("priceMin")).toHaveTextContent("null");
      expect(screen.getByTestId("priceMax")).toHaveTextContent("null");
      expect(screen.getByTestId("yearMin")).toHaveTextContent("null");
      expect(screen.getByTestId("yearMax")).toHaveTextContent("null");
      expect(screen.getByTestId("mileageMin")).toHaveTextContent("null");
      expect(screen.getByTestId("mileageMax")).toHaveTextContent("null");
      expect(screen.getByTestId("features")).toHaveTextContent("[]");
    });
  });

  describe("📋 Functional Standards - Actions", () => {
    it("should update search term", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Search Toyota"));
      expect(screen.getByTestId("searchTerm")).toHaveTextContent("Toyota");
    });

    it("should update status filter", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Filter Available"));
      expect(screen.getByTestId("statusFilter")).toHaveTextContent("available");
    });

    it("should update price range", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Set Min Price"));
      expect(screen.getByTestId("priceMin")).toHaveTextContent("5000");

      await user.click(screen.getByText("Set Max Price"));
      expect(screen.getByTestId("priceMax")).toHaveTextContent("50000");
    });

    it("should update make", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Set Make"));
      expect(screen.getByTestId("make")).toHaveTextContent("Honda");
    });

    it("should update year range", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Set Year Min"));
      expect(screen.getByTestId("yearMin")).toHaveTextContent("2020");

      await user.click(screen.getByText("Set Year Max"));
      expect(screen.getByTestId("yearMax")).toHaveTextContent("2024");
    });

    it("should update mileage range", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Set Mileage Min"));
      expect(screen.getByTestId("mileageMin")).toHaveTextContent("1000");

      await user.click(screen.getByText("Set Mileage Max"));
      expect(screen.getByTestId("mileageMax")).toHaveTextContent("100000");
    });

    it("should update doors", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Set Doors"));
      expect(screen.getByTestId("doors")).toHaveTextContent("4");
    });

    it("should update colour", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Set Colour"));
      expect(screen.getByTestId("colour")).toHaveTextContent("Red");
    });

    it("should set features", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Set Features"));
      expect(screen.getByTestId("features")).toHaveTextContent(
        '["Bluetooth","GPS"]'
      );
    });

    it("should toggle a feature on", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      await user.click(screen.getByText("Toggle Bluetooth"));
      expect(screen.getByTestId("features")).toHaveTextContent('["Bluetooth"]');
    });

    it("should toggle a feature off", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      // Toggle on
      await user.click(screen.getByText("Toggle Bluetooth"));
      expect(screen.getByTestId("features")).toHaveTextContent('["Bluetooth"]');

      // Toggle off
      await user.click(screen.getByText("Toggle Bluetooth"));
      expect(screen.getByTestId("features")).toHaveTextContent("[]");
    });

    it("should reset all filters to defaults", async () => {
      const user = userEvent.setup();
      render(
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      );

      // Set some filters
      await user.click(screen.getByText("Search Toyota"));
      await user.click(screen.getByText("Set Make"));
      await user.click(screen.getByText("Set Min Price"));

      // Reset
      await user.click(screen.getByText("Reset"));

      expect(screen.getByTestId("searchTerm")).toHaveTextContent("");
      expect(screen.getByTestId("make")).toHaveTextContent("all");
      expect(screen.getByTestId("priceMin")).toHaveTextContent("null");
    });
  });

  describe("Error Handling", () => {
    it("should throw when useFilters is used outside FilterProvider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        "useFilters must be used within a FilterProvider"
      );

      consoleError.mockRestore();
    });
  });
});
