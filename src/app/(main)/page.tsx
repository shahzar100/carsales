import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import LatestArrivals from "@/components/Home/LatestArrivals";
import WhyChooseHome from "@/components/Home/WhyChooseHome";
import { getLatestCars } from "@/lib/models";
import { JsonLd } from "@/components/SEO/JsonLd";

// Home shows the 6 latest cars + featured vehicles. Cache for 60 s so a
// fresh upload appears within a minute. (Audit #1; layout no longer
// force-dynamic.)
export const revalidate = 60;

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "MMC Leeds";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: `${businessName} — Car Sales & Services`,
  description:
    "Browse quality vehicles, book car viewings, and access professional auto services including detailing, tinting, repairs, and breakdown recovery.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${businessName} — Car Sales & Services`,
    description:
      "Browse quality vehicles, book car viewings, and access professional auto services.",
    url: "/",
  },
};

export default async function Home() {
  const latestCars = await getLatestCars(6);

  const autoDealer = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: businessName,
    url: siteUrl,
    description:
      "Quality car sales, vehicle viewings, and professional auto services including detailing, window tinting, repairs, and breakdown recovery.",
    currenciesAccepted: "GBP",
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Car Sales" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Car Detailing" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Window Tinting" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Auto Repairs" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Breakdown Recovery" },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <JsonLd data={autoDealer} />
      <HeroSection />
      <LatestArrivals cars={latestCars} />
      <WhyChooseHome />
    </div>
  );
}
