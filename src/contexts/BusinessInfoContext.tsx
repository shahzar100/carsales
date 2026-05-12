"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { ShopInfo } from "@/lib/interfaces";

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

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/businessinfo");
      const result = await response.json();

      if (result.success && result.data) {
        setBusinessInfo(result.data);
      }
    } catch (error) {
      console.error("Error fetching business info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  return (
    <BusinessInfoContext.Provider
      value={{
        businessInfo,
        loading,
        refetch: fetchBusinessInfo,
      }}
    >
      {children}
    </BusinessInfoContext.Provider>
  );
};

export const useBusinessInfo = () => {
  const context = useContext(BusinessInfoContext);
  if (context === undefined) {
    throw new Error(
      "useBusinessInfo must be used within a BusinessInfoProvider"
    );
  }
  return context;
};
