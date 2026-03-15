import { ShopInfo } from "@/lib/interfaces";
import { getBusinessInfoCollection, serializeDocument } from "@/lib/models";

/**
 * Initial seed data inserted into MongoDB on first read.
 * After that, all values come exclusively from the database.
 */
const SEED_DATA: Omit<ShopInfo, "_id"> = {
  businessName: "Car Sales & Viewing",
  address: "123 Auto Street",
  city: "City",
  state: "",
  zipCode: "",
  phone: "(555) 123-4567",
  email: "info@carsales.com",
  bookingsEmail: "bookings@carsales.com",
  googleMapsUrl: "https://maps.google.com",
  hours: {
    monday: "9:00 AM - 6:00 PM",
    tuesday: "9:00 AM - 6:00 PM",
    wednesday: "9:00 AM - 6:00 PM",
    thursday: "9:00 AM - 6:00 PM",
    friday: "9:00 AM - 6:00 PM",
    saturday: "9:00 AM - 4:00 PM",
    sunday: "Closed",
  },
  description:
    "Browse our premium car collection with convenient viewing and booking services.",
  socialMedia: {
    facebook: "",
    twitter: "",
    instagram: "",
  },

  heroStats: {
    vehicles: { value: "500+", label: "Quality Vehicles" },
    booking: { value: "24/7", label: "Online Booking" },
    rating: { value: "4.9", label: "Customer Rating" },
  },

  detailingPackages: [
    {
      id: "bronze",
      name: "Detailing Bronze",
      subtitle: "Mini Valet",
      price: "£150",
      duration: "2-3 hours",
      description: "Essential cleaning for your vehicle inside and out",
      exteriorFeatures: [
        "Citrus pre wash treatment",
        "Snow foam",
        "Contact wash",
        "Towel and blow dry",
        "Alloy wheels, tyres and arches deep cleaned",
        "Tyre dressing",
      ],
      interiorFeatures: [
        "Seats, mats and carpets vacuumed",
        "High pressure blowout",
        "All interior plastics and surfaces hot wiped",
        "Steering wheel clean program",
        "Windows cleaned inside and out",
      ],
      popular: false,
      includesPrevious: null,
    },
    {
      id: "silver",
      name: "Detailing Silver",
      subtitle: "Mini Outside, Full Inside",
      price: "£280",
      duration: "4-5 hours",
      description:
        "Enhanced exterior protection with comprehensive interior deep clean",
      exteriorFeatures: [
        "All services from Bronze",
        "3 month high gloss ceramic protection",
      ],
      interiorFeatures: [
        "All services from Bronze",
        "All interior plastics and surfaces deep cleaned",
        "Leather conditioner / fabric shampoo",
        "All surfaces, plastics steam cleaned",
      ],
      popular: true,
      includesPrevious: "Bronze",
    },
    {
      id: "gold",
      name: "Detailing Gold",
      subtitle: "Complete Premium Service",
      price: "£450",
      duration: "6-8 hours",
      description:
        "Ultimate detailing package with full paint decontamination and deep interior extraction",
      exteriorFeatures: [
        "All services from Silver",
        "Paint decontamination",
        "Iron contaminant removal",
        "Tar and glue contaminant removal",
        "Clay bar treatment",
      ],
      interiorFeatures: [
        "All services from Silver",
        "Full extraction clean of seats, mats and carpets",
      ],
      popular: false,
      includesPrevious: "Silver",
    },
  ],

  tintOptions: [
    {
      name: "Ceramic Premium",
      type: "Ceramic",
      price: "£400-£800",
      vlt: "5%, 20%, 35%, 50%",
      warranty: "Lifetime",
      description:
        "Top-tier ceramic film with superior heat rejection and clarity",
      features: [
        "99% UV protection",
        "Superior heat rejection (up to 80%)",
        "No signal interference",
        "Fade resistant",
        "Scratch resistant",
        "Lifetime warranty",
      ],
      popular: true,
    },
    {
      name: "Carbon Series",
      type: "Carbon",
      price: "£300-£600",
      vlt: "5%, 20%, 35%, 50%",
      warranty: "10 Years",
      description:
        "Advanced carbon technology for excellent performance and durability",
      features: [
        "99% UV protection",
        "Good heat rejection (up to 60%)",
        "Non-metallic (no interference)",
        "Matte finish appearance",
        "Color stable",
        "10-year warranty",
      ],
      popular: false,
    },
    {
      name: "Dyed Film",
      type: "Traditional",
      price: "£200-£400",
      vlt: "5%, 20%, 35%, 50%",
      warranty: "5 Years",
      description:
        "Quality dyed film offering good privacy and basic heat rejection",
      features: [
        "95% UV protection",
        "Basic heat rejection (up to 35%)",
        "Good privacy",
        "Cost-effective",
        "Professional installation",
        "5-year warranty",
      ],
      popular: false,
    },
  ],

  serviceOverviews: [
    {
      id: "detailing",
      title: "Car Detailing",
      subtitle: "Premium interior & exterior care",
      priceRange: "£150 – £500",
      duration: "3-6 hours",
      features: [
        "Interior & Exterior Deep Clean",
        "Paint Protection & Waxing",
        "Leather Treatment",
        "Engine Bay Cleaning",
        "Ceramic Coating Available",
      ],
    },
    {
      id: "tints",
      title: "Window Tinting",
      subtitle: "Privacy, UV protection & style",
      priceRange: "£200 – £800",
      duration: "2-4 hours",
      features: [
        "Premium Film Quality",
        "UV Ray Protection",
        "Heat Reduction",
        "Privacy Enhancement",
        "Lifetime Warranty",
      ],
    },
    {
      id: "repairs",
      title: "Auto Repairs",
      subtitle: "Expert service for all makes & models",
      priceRange: "Quote on Request",
      duration: "1-5 days",
      features: [
        "Engine Diagnostics",
        "Brake System Repair",
        "Transmission Service",
        "Electrical Systems",
        "Preventive Maintenance",
      ],
    },
  ],

  recovery: {
    coverageAreas: [
      "Central London",
      "North London",
      "South London",
      "East London",
      "West London",
      "Greater London",
      "Surrey",
      "Kent",
      "Essex",
      "Hertfordshire",
      "Berkshire",
      "Buckinghamshire",
    ],
    pricingTiers: [
      {
        name: "Local Recovery",
        price: "From £60",
        distance: "Within 10 miles",
      },
      { name: "Regional Recovery", price: "From £95", distance: "10–30 miles" },
      { name: "Long Distance", price: "Call Us", distance: "30+ miles" },
    ],
    responseTime: "30-45 minutes within London",
  },

  updatedAt: new Date(),
};

/**
 * Fetch business info from MongoDB.
 * On first ever read, seeds the collection with initial data so values always exist.
 */
export async function getBusinessInfo(): Promise<ShopInfo> {
  const collection = await getBusinessInfoCollection();
  const doc = await collection.findOne({});

  if (doc) {
    return serializeDocument(doc) as ShopInfo;
  }

  // First-time setup: seed the database with initial data
  await collection.insertOne(SEED_DATA as ShopInfo);
  const seeded = await collection.findOne({});
  return serializeDocument(seeded!) as ShopInfo;
}
