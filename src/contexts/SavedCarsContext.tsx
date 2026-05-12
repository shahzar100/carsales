"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

/**
 * Day 10 / Fix 10.4 — saved cars (customer wishlist).
 *
 * LocalStorage-only by design — no auth, no DB row, no PII. Keeps the
 * surface area of the customer auth story zero ("create an account to
 * save cars" is a friction-creating funnel step we don't need here).
 *
 * Storage shape: a JSON array of car _id strings under
 * `saved-cars` in localStorage. Capped at SAVED_CARS_MAX entries —
 * if a customer wants more than this they should pick up the phone.
 */

const STORAGE_KEY = "saved-cars";
const SAVED_CARS_MAX = 50;

interface SavedCarsContextValue {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const SavedCarsContext = createContext<SavedCarsContextValue | undefined>(
  undefined
);

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage can throw QuotaExceededError or be disabled entirely
    // (Safari private browsing). Failing silently keeps the UI working.
  }
}

export function SavedCarsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Hydrate on mount; first SSR render returns `[]` so server and client
  // markup match.
  useEffect(() => {
    setSavedIds(readStorage());
  }, []);

  // Sync changes across browser tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setSavedIds(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((ids: string[]) => {
    setSavedIds(ids);
    writeStorage(ids);
  }, []);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggle = useCallback(
    (id: string) => {
      if (savedIds.includes(id)) {
        persist(savedIds.filter((x) => x !== id));
      } else if (savedIds.length < SAVED_CARS_MAX) {
        persist([...savedIds, id]);
      }
    },
    [savedIds, persist]
  );

  const remove = useCallback(
    (id: string) => persist(savedIds.filter((x) => x !== id)),
    [savedIds, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({ savedIds, isSaved, toggle, remove, clear }),
    [savedIds, isSaved, toggle, remove, clear]
  );

  return (
    <SavedCarsContext.Provider value={value}>
      {children}
    </SavedCarsContext.Provider>
  );
}

export function useSavedCars(): SavedCarsContextValue {
  const ctx = useContext(SavedCarsContext);
  if (!ctx) {
    throw new Error("useSavedCars must be used within SavedCarsProvider");
  }
  return ctx;
}
