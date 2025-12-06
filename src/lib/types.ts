export interface Car {
  _id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  doors: number;
  colour: string;
  status: string;
  image?: string;
}

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

export interface ShopInfo {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  hours: {
    [key: string]: string;
  };
  description?: string;
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
