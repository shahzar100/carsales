import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import LatestArrivals from "@/components/Home/LatestArrivals";
import WhyChooseHome from "@/components/Home/WhyChooseHome";
import { getLatestCars } from "@/lib/models";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import { JsonLd } from "@/components/SEO/JsonLd";

// Home shows the 6 latest cars + featured vehicles. Cache for 60 s so a
// fresh upload appears within a minute. (Audit #1; layout no longer
// force-dynamic.)
export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getBusinessInfo();

  return {
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
}

const buildAutoDealer = (businessName: string) => ({
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
      itemOffered: { "@type": "Service", name: "Window Tinting & Car Wrapping" },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Vehicle Repairs & Diagnostics",
      },
    },
    {
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: "Vehicle Modifications" },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Brand New Tyres Supplied & Fitted",
      },
    },
    {
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: "Accident Claims Management" },
    },
    {
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: "Breakdown Recovery" },
    },
  ],
});

export default async function Home() {
  const [latestCars, { businessName }] = await Promise.all([
    getLatestCars(6),
    getBusinessInfo(),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <JsonLd data={buildAutoDealer(businessName)} />
      <HeroSection />
      <LatestArrivals cars={latestCars} />
      <WhyChooseHome />
    </div>
  );
}
