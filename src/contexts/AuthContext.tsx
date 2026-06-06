"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  use,
} from "react";
import { useRouter } from "next/navigation";
import { logError } from "@/lib/utils/observability";

/**
 * AuthContext — client-side glue for admin auth.
 *
 * (#10) This used to gate the entire admin subtree from the client,
 * which let the JS bundle and dashboard markup hydrate before the
 * auth check resolved. The server-side guard in
 * `(admin)/admin/dashboard/layout.tsx` now handles access control.
 *
 * What's left here:
 *   - `isLoggedIn` flag for the nav tabs (Login vs Logout button)
 *   - `login()` and `logout()` helpers that hit the API and route
 *
 * It never renders a blocking spinner or redirects on its own — the
 * server-side layout already did that work before we got here.
 */
interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthWrapper");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  // Optimistic: if we made it past the server-side guard, the user is
  // logged in. The login page initialises this to false instead, but
  // gets corrected when it actually checks the session below.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // One-shot session check on mount so the navigation knows whether to
  // show "Logout" or hide. We don't block rendering on it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/session");
        const result = await response.json();
        if (!cancelled) setIsLoggedIn(Boolean(result.isLoggedIn));
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsLoggedIn(false);
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      logError(error, { context: "AuthProvider.logout" });
    }
  }, [router]);

  const login = useCallback(() => {
    setIsLoggedIn(true);
    router.push("/admin/dashboard");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ isLoggedIn, login, logout }),
    [isLoggedIn, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
