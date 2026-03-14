"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface BusinessInfo {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  description?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

interface BusinessInfoContextType {
  businessInfo: BusinessInfo | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const BusinessInfoContext = createContext<BusinessInfoContextType | undefined>(
  undefined
);

export const BusinessInfoProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
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
