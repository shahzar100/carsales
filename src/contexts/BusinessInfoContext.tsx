"use client";
import React, {
  createContext,
  use,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type { ShopInfo } from "@/lib/interfaces";
import { logError } from "@/lib/utils/observability";

// Re-export the ShopInfo type as BusinessInfo for backward compatibility
export type BusinessInfo = ShopInfo;

interface BusinessInfoContextType {
  businessInfo: ShopInfo | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const BusinessInfoContext = createContext<BusinessInfoContextType | undefined>(
  undefined
);

export const BusinessInfoProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [businessInfo, setBusinessInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusinessInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/businessinfo");
      const result = await response.json();

      if (result.success && result.data) {
        setBusinessInfo(result.data);
      }
    } catch (error) {
      logError(error, { context: "BusinessInfoProvider.fetchBusinessInfo" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinessInfo();
  }, [fetchBusinessInfo]);

  const value = useMemo(
    () => ({
      businessInfo,
      loading,
      refetch: fetchBusinessInfo,
    }),
    [businessInfo, loading, fetchBusinessInfo]
  );

  return (
    <BusinessInfoContext.Provider value={value}>
      {children}
    </BusinessInfoContext.Provider>
  );
};

export const useBusinessInfo = () => {
  const context = use(BusinessInfoContext);
  if (context === undefined) {
    throw new Error(
      "useBusinessInfo must be used within a BusinessInfoProvider"
    );
  }
  return context;
};
