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

export interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface DetailingPackage {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceInPence?: number;
  duration: string;
  description: string;
  exteriorFeatures: string[];
  interiorFeatures: string[];
  popular: boolean;
  includesPrevious: string | null;
}

export interface TintOption {
  name: string;
  type: string;
  price: string;
  priceMinInPence?: number;
  priceMaxInPence?: number;
  vlt: string;
  warranty: string;
  description: string;
  features: string[];
  popular: boolean;
}

export interface RecoveryPricingTier {
  name: string;
  price: string;
  distance: string;
}

export interface RecoveryInfo {
  coverageAreas: string[];
  pricingTiers: RecoveryPricingTier[];
  responseTime: string;
}

export interface ServiceOverview {
  id: string;
  title: string;
  subtitle: string;
  priceRange: string;
  duration: string;
  features: string[];
}

export interface ShopInfo {
  _id?: string;
  // Core business info
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  bookingsEmail?: string;
  googleMapsUrl?: string;
  hours: BusinessHours;
  description?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };

  // Hero section stats
  heroStats?: {
    vehicles: HeroStat;
    booking: HeroStat;
    rating: HeroStat;
  };

  // Service packages
  detailingPackages?: DetailingPackage[];
  tintOptions?: TintOption[];
  serviceOverviews?: ServiceOverview[];

  // Recovery / Breakdown
  recovery?: RecoveryInfo;

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

export interface Quote {
  _id?: string;
  quoteReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  serviceType: string;
  serviceDetails?: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    registration?: string;
  };
  status: "pending" | "responded" | "accepted" | "expired";
  createdAt: Date;
  updatedAt: Date;
}
