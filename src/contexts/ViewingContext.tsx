"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

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
  dealership?: {
    location: string;
    address: string;
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

  const updateViewingBooking = (updates: Partial<ViewingBooking>) => {
    setViewingBooking((prev) => ({ ...prev, ...updates }));
  };

  const clearViewingBooking = () => {
    setViewingBooking({});
  };

  const addBooking = (booking: ViewingBooking) => {
    setBookings((prev) => [
      ...prev,
      { ...booking, carId: Date.now().toString() },
    ]);
    clearViewingBooking();
  };

  return (
    <ViewingContext.Provider
      value={{
        viewingBooking,
        setViewingBooking,
        updateViewingBooking,
        clearViewingBooking,
        bookings,
        addBooking,
      }}
    >
      {children}
    </ViewingContext.Provider>
  );
};

export const useViewing = () => {
  const context = useContext(ViewingContext);
  if (context === undefined) {
    throw new Error("useViewing must be used within a ViewingProvider");
  }
  return context;
};
