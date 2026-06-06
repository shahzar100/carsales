"use client";
import React, {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  ReactNode,
} from "react";

interface ViewingBooking {
  carId?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
    fuel?: string;
    doors?: number;
    colour?: string;
    mileage?: number;
  };
  selectedDate?: string;
  selectedTime?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface ViewingContextType {
  viewingBooking: ViewingBooking;
  setViewingBooking: (booking: ViewingBooking) => void;
  updateViewingBooking: (updates: Partial<ViewingBooking>) => void;
  clearViewingBooking: () => void;
  bookings: ViewingBooking[];
  addBooking: (booking: ViewingBooking) => void;
}

const ViewingContext = createContext<ViewingContextType | undefined>(undefined);

export const ViewingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [viewingBooking, setViewingBooking] = useState<ViewingBooking>({});
  const [bookings, setBookings] = useState<ViewingBooking[]>([]);

  const updateViewingBooking = useCallback((updates: Partial<ViewingBooking>) => {
    setViewingBooking((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearViewingBooking = useCallback(() => {
    setViewingBooking({});
  }, []);

  const addBooking = useCallback(
    (booking: ViewingBooking) => {
      setBookings((prev) => [
        ...prev,
        { ...booking, carId: Date.now().toString() },
      ]);
      clearViewingBooking();
    },
    [clearViewingBooking],
  );

  const value = useMemo(
    () => ({
      viewingBooking,
      setViewingBooking,
      updateViewingBooking,
      clearViewingBooking,
      bookings,
      addBooking,
    }),
    [
      viewingBooking,
      updateViewingBooking,
      clearViewingBooking,
      bookings,
      addBooking,
    ],
  );

  return (
    <ViewingContext.Provider value={value}>{children}</ViewingContext.Provider>
  );
};

export const useViewing = () => {
  const context = use(ViewingContext);
  if (context === undefined) {
    throw new Error("useViewing must be used within a ViewingProvider");
  }
  return context;
};
