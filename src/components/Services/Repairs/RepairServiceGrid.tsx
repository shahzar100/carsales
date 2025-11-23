import React from "react";
import { CheckCircle, LucideIcon } from "lucide-react";

interface RepairCategory {
  category: string;
  icon: LucideIcon;
  color: string;
  services: string[];
}

interface RepairServiceGridProps {
  repairServices: RepairCategory[];
}

const RepairServiceGrid: React.FC<RepairServiceGridProps> = ({
  repairServices,
}) => {
  return (
    <div className="mb-16">
      <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
        Our Repair Services
      </h2>
      <div className="grid gap-8 md:grid-cols-2">
        {repairServices.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-8 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="mb-6 flex items-center">
                <div
                  className={`${category.color} mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white`}
                >
                  <IconComponent size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {category.category}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {category.services.map((service, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircle className="mr-3 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <a
                  href={`mailto:info@carsales.com?subject=Repair Service Inquiry - ${category.category}&body=Hi, I need repair services for ${category.category}. Please provide a quote and available appointment times.`}
                  className="block w-full rounded-lg bg-gray-900 px-6 py-3 text-center font-medium text-white transition-colors duration-200 hover:bg-gray-800"
                >
                  Get Quote for {category.category}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RepairServiceGrid;
