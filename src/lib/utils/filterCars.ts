import { CarInterface } from "@/lib/interfaces";
import { FilterState } from "@/contexts/FilterContext";

/**
 * Filters an array of cars based on the current filter state.
 * Used by CarView to apply search, status, make, year, price,
 * mileage, doors, colour, and feature filters.
 */
export const filterCars = (
  cars: CarInterface[],
  state: FilterState
): CarInterface[] => {
  return cars.filter((car) => {
    const matchesSearch =
      state.searchTerm === "" ||
      `${car.make} ${car.model} ${car.year} ${car.colour}`
        .toLowerCase()
        .includes(state.searchTerm.toLowerCase());

    const matchesStatus =
      state.statusFilter === "all" || car.status === state.statusFilter;

    const matchesMake = state.make === "all" || car.make === state.make;

    const matchesYearMin = state.yearMin === null || car.year >= state.yearMin;
    const matchesYearMax = state.yearMax === null || car.year <= state.yearMax;

    const matchesPriceMin =
      state.priceMin === null || car.price >= state.priceMin;
    const matchesPriceMax =
      state.priceMax === null || car.price <= state.priceMax;

    const matchesMileageMin =
      state.mileageMin === null || car.mileage >= state.mileageMin;
    const matchesMileageMax =
      state.mileageMax === null || car.mileage <= state.mileageMax;

    const matchesDoors =
      state.doors === "all" || car.doors === parseInt(state.doors, 10);

    const matchesColour = state.colour === "all" || car.colour === state.colour;

    const matchesFeatures =
      state.features.length === 0 ||
      state.features.every((feature) => car.features?.includes(feature));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMake &&
      matchesYearMin &&
      matchesYearMax &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesMileageMin &&
      matchesMileageMax &&
      matchesDoors &&
      matchesColour &&
      matchesFeatures
    );
  });
};
