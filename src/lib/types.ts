import { CarInterface, ServiceAppointment, CarViewingBooking, ShopInfo } from "@/lib/interfaces";

export type { CarInterface as Car, ServiceAppointment, CarViewingBooking, ShopInfo };

export interface Booking {
  _id: string;
  bookingReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  serviceType?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

export interface Notification {
  type: "success" | "error";
  message: string;
}

export type ActiveTab = "cars" | "service" | "viewing" | "shop";

export interface SelectedBooking {
  booking: Booking;
  type: string;
}
