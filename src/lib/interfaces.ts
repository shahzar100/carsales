export interface CarInterface {
  _id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: "Petrol" | "Diesel" | "Electric" | "Hybrid";
  transmission: "Manual" | "Automatic" | "CVT";
  doors: number;
  colour: string;
  image?: string; // URL/path to main image
  images?: string[]; // Array of image URLs/paths
  description?: string;
  features?: string[];
  status: "available" | "sold" | "reserved";
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
}

export interface ServiceAppointment {
  _id?: string;
  bookingReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  serviceType: string;
  serviceDetails?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarViewingBooking {
  _id?: string;
  bookingReference: string;
  carId: string;
  carDetails: {
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
  };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  dealership?: {
    location: string;
    address: string;
  };
  status: "pending" | "confirmed" | "completed" | "cancelled";
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopInfo {
  _id?: string;
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
  updatedAt: Date;
}

export interface AdminUser {
  _id?: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "staff" | "manager" | "admin";
  createdAt: Date;
  lastLogin?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  updatedAt?: Date;
}
