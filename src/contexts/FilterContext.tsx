"use client";
import React, {
  createContext,
  use,
  useMemo,
  useReducer,
  ReactNode,
} from "react";

// Filter state interface
interface FilterState {
  searchTerm: string;
  statusFilter: string;
  priceMin: number | null;
  priceMax: number | null;
  make: string;
  yearMin: number | null;
  yearMax: number | null;
  mileageMin: number | null;
  mileageMax: number | null;
  doors: string;
  colour: string;
  features: string[];
}

// Action types
type FilterAction =
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_STATUS_FILTER"; payload: string }
  | { type: "SET_PRICE_MIN"; payload: number | null }
  | { type: "SET_PRICE_MAX"; payload: number | null }
  | { type: "SET_MAKE"; payload: string }
  | { type: "SET_YEAR_MIN"; payload: number | null }
  | { type: "SET_YEAR_MAX"; payload: number | null }
  | { type: "SET_MILEAGE_MIN"; payload: number | null }
  | { type: "SET_MILEAGE_MAX"; payload: number | null }
  | { type: "SET_DOORS"; payload: string }
  | { type: "SET_COLOUR"; payload: string }
  | { type: "SET_FEATURES"; payload: string[] }
  | { type: "TOGGLE_FEATURE"; payload: string }
  | { type: "RESET_FILTERS" };

// Initial state
const initialState: FilterState = {
  searchTerm: "",
  statusFilter: "all",
  priceMin: null,
  priceMax: null,
  make: "all",
  yearMin: null,
  yearMax: null,
  mileageMin: null,
  mileageMax: null,
  doors: "all",
  colour: "all",
  features: [],
};

// Reducer function
const filterReducer = (
  state: FilterState,
  action: FilterAction
): FilterState => {
  switch (action.type) {
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload };
    case "SET_PRICE_MIN":
      return { ...state, priceMin: action.payload };
    case "SET_PRICE_MAX":
      return { ...state, priceMax: action.payload };
    case "SET_MAKE":
      return { ...state, make: action.payload };
    case "SET_YEAR_MIN":
      return { ...state, yearMin: action.payload };
    case "SET_YEAR_MAX":
      return { ...state, yearMax: action.payload };
    case "SET_MILEAGE_MIN":
      return { ...state, mileageMin: action.payload };
    case "SET_MILEAGE_MAX":
      return { ...state, mileageMax: action.payload };
    case "SET_DOORS":
      return { ...state, doors: action.payload };
    case "SET_COLOUR":
      return { ...state, colour: action.payload };
    case "SET_FEATURES":
      return { ...state, features: action.payload };
    case "TOGGLE_FEATURE":
      return {
        ...state,
        features: state.features.includes(action.payload)
          ? state.features.filter((f) => f !== action.payload)
          : [...state.features, action.payload],
      };
    case "RESET_FILTERS":
      return initialState;
    default:
      return state;
  }
};

// Context interface
interface FilterContextType {
  state: FilterState;
  dispatch: React.Dispatch<FilterAction>;
}

// Create context
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Provider component
export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

// Custom hook to use the filter context
export const useFilters = () => {
  const context = use(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
};

export type { FilterState, FilterAction };
