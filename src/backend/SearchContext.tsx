"use client";

import { createContext, useContext } from "react";

interface SearchContextProviderProps {
  children: React.ReactNode;
}

const SearchContext = createContext({});

export const SearchContextProvider: React.FC<SearchContextProviderProps> = ({
  children,
}) => {
  return <SearchContext.Provider value={{}}>{children}</SearchContext.Provider>;
};

export const useSearchContext = () => useContext(SearchContext);
