"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface ShopInfo {
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

interface ShopContextType {
  shopInfo: ShopInfo | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultShopInfo: ShopInfo = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "123 Auto Street",
  city: process.env.NEXT_PUBLIC_BUSINESS_CITY || "City",
  state: process.env.NEXT_PUBLIC_BUSINESS_STATE || "State",
  zipCode: process.env.NEXT_PUBLIC_BUSINESS_ZIP || "12345",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "(555) 123-4567",
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "info@carsales.com",
  hours: {
    monday: "9:00 AM - 6:00 PM",
    tuesday: "9:00 AM - 6:00 PM",
    wednesday: "9:00 AM - 6:00 PM",
    thursday: "9:00 AM - 6:00 PM",
    friday: "9:00 AM - 6:00 PM",
    saturday: "10:00 AM - 4:00 PM",
    sunday: "Closed",
  },
  description: "Your trusted car dealership",
  socialMedia: {
    facebook: "",
    twitter: "",
    instagram: "",
  },
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShopInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/shop");
      const result = await response.json();

      if (result.success && result.data) {
        setShopInfo(result.data);
      } else {
        setShopInfo(defaultShopInfo);
      }
    } catch (error) {
      console.error("Error fetching shop info:", error);
      setShopInfo(defaultShopInfo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopInfo();
  }, []);

  return (
    <ShopContext.Provider
      value={{
        shopInfo,
        loading,
        refetch: fetchShopInfo,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};
