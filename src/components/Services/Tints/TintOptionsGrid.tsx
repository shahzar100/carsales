import React from "react";
import { CheckCircle } from "lucide-react";

interface TintOption {
  name: string;
  type: string;
  price: string;
  vlt: string;
  warranty: string;
  description: string;
  features: string[];
  popular: boolean;
}

interface TintOptionsGridProps {
  tintOptions: TintOption[];
}

const TintOptionsGrid: React.FC<TintOptionsGridProps> = ({ tintOptions }) => {
  return (
    <div className="mb-16">
      <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
        Tint Film Options
      </h2>
      <div className="grid gap-8 lg:grid-cols-3">
        {tintOptions.map((option, index) => (
          <div
            key={index}
            className={`relative rounded-2xl border-2 bg-white p-8 ${
              option.popular
                ? "scale-105 transform border-purple-500 shadow-lg"
                : "border-gray-200 hover:border-purple-300 hover:shadow-md"
            } transition-all duration-300`}
          >
            {option.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                <span className="rounded-full bg-purple-500 px-4 py-2 text-sm font-medium text-white">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6 text-center">
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                {option.name}
              </h3>
              <div className="mb-2 text-lg font-medium text-purple-600">
                {option.type} Film
              </div>
              <div className="mb-2 text-3xl font-bold text-purple-600">
                {option.price}
              </div>
              <p className="text-gray-600">{option.description}</p>
            </div>

            <div className="mb-6 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex justify-between">
                  <span className="font-medium text-gray-700">
                    VLT Options:
                  </span>
                  <span className="text-gray-600">{option.vlt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Warranty:</span>
                  <span className="text-gray-600">{option.warranty}</span>
                </div>
              </div>

              <div className="space-y-2">
                {option.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle className="mt-0.5 mr-3 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`mailto:info@carsales.com?subject=Window Tinting Quote - ${option.name}&body=Hi, I'd like to get a quote for ${option.name} window tinting. Please provide pricing and availability.`}
                className={`block w-full rounded-lg px-6 py-3 text-center font-medium transition-colors duration-200 ${
                  option.popular
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                Get Quote
              </a>
              <a
                href={`tel:(555)123-4567`}
                className="block w-full rounded-lg bg-gray-100 px-6 py-3 text-center font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200"
              >
                Call for Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TintOptionsGrid;
