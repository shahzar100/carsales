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
    <div className="mb-8 md:mb-16">
      <h2 className="section-title mb-6 text-center md:mb-12">
        Our Repair Services
      </h2>
      <div className="grid gap-8 md:grid-cols-2">
        {repairServices.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.category}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow duration-300 hover:shadow-lg sm:p-6 lg:p-8"
            >
              <div className="mb-6 flex items-center">
                <div
                  className={`${category.color} mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white`}
                >
                  <IconComponent size={24} />
                </div>
                <h3 className="heading-3">{category.category}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {category.services.map((service) => (
                  <div key={service} className="flex items-center">
                    <CheckCircle className="mr-3 h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RepairServiceGrid;
