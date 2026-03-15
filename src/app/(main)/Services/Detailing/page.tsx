import React from "react";
import type { Metadata } from "next";
import { Sparkles, CheckCircle, Clock, Shield } from "lucide-react";
import { ServiceHero, BackNavigation } from "@/components/Services/Common";
import { DetailingPackageGrid } from "@/components/Services/Detailing";
import ServiceBookingForm from "@/components/Main/Form/ServiceBookingForm";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

export const metadata: Metadata = {
  title: "Car Detailing Services",
  description:
    "Premium car detailing packages from £150. Interior and exterior deep clean, paint protection, ceramic coating, and leather treatment. Book your detailing today.",
  alternates: { canonical: "/Services/Detailing" },
  openGraph: {
    title: "Car Detailing Services",
    description:
      "Premium car detailing packages from £150. Interior and exterior deep clean, paint protection, and more.",
    url: "/Services/Detailing",
  },
};

const Detailing = async () => {
  const businessInfo = await getBusinessInfo();
  const detailingPackages = businessInfo.detailingPackages!;

  const heroProps = {
    icon: Sparkles,
    iconBgColor: "bg-red-50 text-red-600",
    title: "Professional Car Detailing",
    description:
      "Transform your vehicle with our premium detailing services. Choose your package below and book today.",
    badges: [
      {
        icon: CheckCircle,
        text: "Eco-Friendly Products",
        color: "text-red-500",
      },
      { icon: Clock, text: "Same Day Service", color: "text-gray-900" },
      {
        icon: Shield,
        text: "Satisfaction Guaranteed",
        color: "text-red-700",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BackNavigation href="/Services" text="Back to Services" />

      <ServiceHero {...heroProps} />

      <DetailingPackageGrid packages={detailingPackages} />

      {/* Book a Detailing Service */}
      <div id="book" className="scroll-mt-8">
        <div className="mb-6 text-center">
          <h2 className="section-title mb-2">Book Your Detailing Service</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Fill in the form below and we&apos;ll confirm your appointment.
          </p>
        </div>
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <ServiceBookingForm defaultService="Detailing" />
        </div>
      </div>
    </div>
  );
};

export default Detailing;
