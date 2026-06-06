"use client";

import {
  createContext,
  useCallback,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

/**
 * Saved cars (customer wishlist).
 *
 * Two-tier storage:
 *   - Signed out → localStorage only, exactly as before. No auth, no DB
 *     row, no PII. A visitor can still build a wishlist with zero friction.
 *   - Signed in  → localStorage stays as a fast local cache, but every
 *     change is also mirrored to the customer's `users` document via
 *     `/api/account/saved`, so the wishlist follows them across devices.
 *
 * On sign-in we do a one-time three-way reconcile: take the union of the
 * server list and whatever was in localStorage, adopt that, and push it
 * back up. That way cars saved while logged out aren't lost when an
 * account is created, and cars saved on another device show up here.
 *
 * Storage shape (localStorage): a JSON array of car `_id` strings under
 * `saved-cars`, capped at SAVED_CARS_MAX entries. The server enforces the
 * same cap (see /api/account/saved).
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

/** Fire-and-forget push of the full list to the server. */
function pushToServer(ids: string[]): void {
  fetch("/api/account/saved", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  }).catch(() => {
    // Offline / transient failure — localStorage still holds the change,
    // and the next sign-in reconcile will pick it back up.
  });
}

export function SavedCarsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const [savedIds, setSavedIds] = useState<string[]>([]);

  // `persist` is stable (deps: []), so it reads auth state through a ref
  // rather than closing over `isAuthed`.
  const isAuthedRef = useRef(isAuthed);
  useEffect(() => {
    isAuthedRef.current = isAuthed;
  }, [isAuthed]);

  // Hydrate from localStorage on mount; first SSR render returns `[]` so
  // server and client markup match.
  useEffect(() => {
    setSavedIds(readStorage());
  }, []);

  // One-time reconcile with the server when the customer signs in.
  // `reconciledRef` resets on sign-out so a later sign-in re-runs it.
  const reconciledRef = useRef(false);
  useEffect(() => {
    if (!isAuthed) {
      reconciledRef.current = false;
      return;
    }
    if (reconciledRef.current) return;
    reconciledRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/saved");
        if (!res.ok) return;
        const json = await res.json();
        const serverIds: string[] = Array.isArray(json?.data?.savedCarIds)
          ? json.data.savedCarIds
          : [];
        const local = readStorage();
        const merged = [...new Set([...serverIds, ...local])].slice(
          0,
          SAVED_CARS_MAX
        );
        if (cancelled) return;
        setSavedIds(merged);
        writeStorage(merged);

        // Only write back if the union actually added something the
        // server didn't already have.
        const serverSet = new Set(serverIds);
        if (
          merged.length !== serverIds.length ||
          merged.some((id) => !serverSet.has(id))
        ) {
          pushToServer(merged);
        }
      } catch {
        // Network failure — fall back to the localStorage list already
        // loaded. reconciledRef stays true so we don't hammer the API;
        // a page reload will retry.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  // Sync changes across browser tabs (signed in or out).
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
    if (isAuthedRef.current) pushToServer(ids);
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
  const ctx = use(SavedCarsContext);
  if (!ctx) {
    throw new Error("useSavedCars must be used within SavedCarsProvider");
  }
  return ctx;
}
