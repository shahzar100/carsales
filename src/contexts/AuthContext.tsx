"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useRouter, usePathname } from "next/navigation";

// Auth Context
interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
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
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logout");
      const result = await response.json();
      setIsLoggedIn(result.isLoggedIn);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsLoggedIn(false);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  const login = useCallback(() => {
    setIsLoggedIn(true);
    router.push("/admin/dashboard");
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoggedIn === null) return;

    // Skip redirect if already on login page
    if (pathname === "/admin/login") return;

    if (!isLoggedIn) {
      router.push("/admin/login");
    }
  }, [isLoggedIn, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && pathname !== "/admin/login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn: isLoggedIn ?? false, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
