import React from "react";
import { CheckCircle } from "lucide-react";

interface DetailingPackage {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  duration: string;
  description: string;
  exteriorFeatures: string[];
  interiorFeatures: string[];
  popular: boolean;
  includesPrevious: string | null;
}

interface DetailingPackageGridProps {
  packages: DetailingPackage[];
  selectedPackage: string;
  onSelectPackage: (packageId: string) => void;
}

const DetailingPackageGrid: React.FC<DetailingPackageGridProps> = ({
  packages,
  selectedPackage,
  onSelectPackage,
}) => {
  return (
    <div className="mb-16">
      <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
        Choose Your Detailing Package
      </h2>

      {/* Package Selection Tabs */}
      <div className="mb-8 flex justify-center">
        <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                selectedPackage === pkg.id
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {pkg.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Package Display */}
      {packages
        .filter((pkg) => pkg.id === selectedPackage)
        .map((pkg) => (
          <div
            key={pkg.id}
            className="mx-auto max-w-4xl rounded-2xl border-2 border-blue-200 bg-white p-8 shadow-lg"
          >
            {pkg.popular && (
              <div className="mb-4 text-center">
                <span className="inline-block rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white">
                  Most Popular
                </span>
              </div>
            )}

            {/* Package Header */}
            <div className="mb-8 text-center">
              <h3 className="mb-2 text-3xl font-bold text-gray-900">
                {pkg.name}
              </h3>
              <p className="mb-2 text-lg font-medium text-blue-600">
                {pkg.subtitle}
              </p>
              <div className="mb-4 text-4xl font-bold text-blue-600">
                {pkg.price}
              </div>
              <div className="mb-4 text-lg text-gray-600">
                Duration: {pkg.duration}
              </div>
              <p className="mx-auto max-w-2xl text-gray-600">
                {pkg.description}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Exterior Features */}
              <div className="rounded-lg bg-blue-50 p-6">
                <h4 className="mb-4 text-xl font-semibold tracking-wide text-blue-900">
                  Exterior Services
                </h4>
                <div className="space-y-2">
                  {pkg.exteriorFeatures.map((feature, idx) => {
                    const isIncluded = feature.startsWith("All services from");
                    return (
                      <div key={idx} className="flex items-start">
                        <CheckCircle
                          className={`mt-0.5 mr-3 h-4 w-4 shrink-0 ${
                            isIncluded ? "text-blue-500" : "text-green-500"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isIncluded
                              ? "font-medium text-blue-700 italic"
                              : "text-gray-700"
                          }`}
                        >
                          {feature}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interior Features */}
              <div className="rounded-lg bg-gray-50 p-6">
                <h4 className="mb-4 text-xl font-semibold tracking-wide text-gray-900">
                  Interior Services
                </h4>
                <div className="space-y-2">
                  {pkg.interiorFeatures.map((feature, idx) => {
                    const isIncluded = feature.startsWith("All services from");
                    return (
                      <div key={idx} className="flex items-start">
                        <CheckCircle
                          className={`mt-0.5 mr-3 h-4 w-4 shrink-0 ${
                            isIncluded ? "text-blue-500" : "text-green-500"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isIncluded
                              ? "font-medium text-blue-700 italic"
                              : "text-gray-700"
                          }`}
                        >
                          {feature}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 text-center">
              <a
                href={`mailto:info@carsales.com?subject=Car Detailing Booking - ${pkg.name}&body=Hi, I'd like to book the ${pkg.name} detailing package (${pkg.price}). Please provide available dates and confirm the booking details.`}
                className="inline-block rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white transition-colors duration-200 hover:bg-blue-700"
              >
                Book {pkg.name} - {pkg.price}
              </a>
            </div>
          </div>
        ))}
    </div>
  );
};

export default DetailingPackageGrid;
