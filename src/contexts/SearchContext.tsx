"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchFilters {
  make?: string | string[];
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  fuelType?: string | string[];
  transmission?: string;
  bodyType?: string;
  color?: string | string[];
  location?: string;
}

interface SearchContextType {
  filters: SearchFilters;
  updateFilters: (updates: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface SearchContextProviderProps {
  children: ReactNode;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchContextProvider: React.FC<SearchContextProviderProps> = ({
  children,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const updateFilters = (updates: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  return (
    <SearchContext.Provider
      value={{
        filters,
        updateFilters,
        clearFilters,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error(
      "useSearchContext must be used within a SearchContextProvider"
    );
  }
  return context;
};
